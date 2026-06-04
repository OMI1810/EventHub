import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	OnModuleDestroy,
	ServiceUnavailableException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	EventEntryDecisionCode,
	EventFormat,
	EventStatus,
	Role,
	TeamFormat
} from '@prisma/client'
import { JwtService } from '@nestjs/jwt'
import Redis from 'ioredis'
import { randomUUID } from 'node:crypto'
import {
	PASS_QR_PREFIX,
	PASS_TOKEN_AUDIENCE,
	PASS_TOKEN_ISSUER,
	PASS_TOKEN_TYPE
} from './pass.constants'
import {
	EventPassPayload,
	PassDecisionResponse,
	PassEligibilityResult
} from './pass.types'

@Injectable()
export class PassService implements OnModuleDestroy {
	private readonly tokenTtlSeconds = 5 * 60
	private readonly redis: Redis

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
	) {
		const redisUrl =
			this.configService.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379'

		this.redis = new Redis(redisUrl, {
			maxRetriesPerRequest: 1,
			enableReadyCheck: true,
			lazyConnect: true
		})
	}

	async onModuleDestroy() {
		await this.redis.quit()
	}

	async issuePassToken(userId: string, eventId: string) {
		await this.requireRole(userId, Role.USER)

		const eligibility = await this.getEligibility(userId, eventId)

		if (!eligibility.allowed) {
			throw new BadRequestException(eligibility.reason)
		}

		const token = await this.jwtService.signAsync(
			{
				sub: userId,
				eventId,
				typ: PASS_TOKEN_TYPE
			},
			{
				jwtid: randomUUID(),
				expiresIn: this.tokenTtlSeconds,
				issuer: PASS_TOKEN_ISSUER,
				audience: PASS_TOKEN_AUDIENCE,
				secret: this.configService.get<string>('JWT_SECRET'),
				noTimestamp: true
			}
		)

		const decoded = this.jwtService.decode(token) as EventPassPayload

		return {
			token,
			qrPayload: `${PASS_QR_PREFIX}${token}`,
			expiresAt: decoded.exp
		}
	}

	async revokePassToken(actorUserId: string, token: string) {
		await this.requireRole(actorUserId, Role.USER)

		let payload: EventPassPayload

		try {
			payload = await this.jwtService.verifyAsync<EventPassPayload>(token, {
				secret: this.configService.get<string>('JWT_SECRET'),
				issuer: PASS_TOKEN_ISSUER,
				audience: PASS_TOKEN_AUDIENCE
			})
		} catch (error) {
			const expired =
				error instanceof Error && error.message.toLowerCase().includes('expired')

			return {
				code: expired
					? EventEntryDecisionCode.DENY_EXPIRED
					: EventEntryDecisionCode.DENY_INVALID,
				revoked: false,
				message: expired ? 'QR token expired' : 'Invalid QR token'
			}
		}

		if (
			payload.typ !== PASS_TOKEN_TYPE ||
			payload.iss !== PASS_TOKEN_ISSUER ||
			payload.aud !== PASS_TOKEN_AUDIENCE
		) {
			return {
				code: EventEntryDecisionCode.DENY_INVALID,
				revoked: false,
				message: 'Invalid token claims'
			}
		}

		if (payload.sub !== actorUserId) {
			return {
				code: EventEntryDecisionCode.DENY_INVALID,
				revoked: false,
				message: 'Token owner mismatch'
			}
		}

		const ttlSeconds = payload.exp - Math.floor(Date.now() / 1000)
		if (ttlSeconds <= 0) {
			return {
				code: EventEntryDecisionCode.DENY_EXPIRED,
				revoked: false,
				message: 'QR token expired'
			}
		}

		await this.ensureRedisConnection()

		const setResult = await this.redis.set(
			this.getConsumedKey(payload.jti),
			JSON.stringify({
				sub: payload.sub,
				eventId: payload.eventId,
				usedAt: Date.now(),
				reason: 'client_revoke'
			}),
			'EX',
			ttlSeconds,
			'NX'
		)

		if (setResult !== 'OK') {
			return {
				code: EventEntryDecisionCode.DENY_REPLAY,
				revoked: true,
				message: 'QR token already revoked'
			}
		}

		return {
			code: EventEntryDecisionCode.ALLOW,
			revoked: true,
			message: 'QR token revoked'
		}
	}

	async verifyAndConsume(
		turniketUserId: string,
		token: string,
		turniketDeviceId?: string
	): Promise<PassDecisionResponse> {
		const turniketUser = await this.requireRole(turniketUserId, Role.TURNIKET)
		const decoded = this.jwtService.decode(token) as Partial<EventPassPayload> | null

		let payload: EventPassPayload

		try {
			payload = await this.jwtService.verifyAsync<EventPassPayload>(token, {
				secret: this.configService.get<string>('JWT_SECRET'),
				issuer: PASS_TOKEN_ISSUER,
				audience: PASS_TOKEN_AUDIENCE
			})
		} catch (error) {
			const expired =
				error instanceof Error && error.message.toLowerCase().includes('expired')

			await this.logEntryAttempt({
				eventId: typeof decoded?.eventId === 'string' ? decoded.eventId : null,
				userId: typeof decoded?.sub === 'string' ? decoded.sub : null,
				turniketUserId: turniketUser.idUser,
				teamId: null,
				caseId: null,
				decision: expired
					? EventEntryDecisionCode.DENY_EXPIRED
					: EventEntryDecisionCode.DENY_INVALID,
				tokenJti: typeof decoded?.jti === 'string' ? decoded.jti : null,
				turniketLabelSnapshot: this.getTurniketLabel(turniketUser),
				userDisplayNameSnapshot: null,
				eventTitleSnapshot: null,
				wasFirstSuccessfulEntry: false,
				failureReason: expired ? 'QR token expired' : 'Invalid QR token',
				scannerDeviceId: turniketDeviceId ?? null
			})

			return {
				code: expired
					? EventEntryDecisionCode.DENY_EXPIRED
					: EventEntryDecisionCode.DENY_INVALID,
				allow: false,
				message: expired ? 'QR token expired' : 'Invalid QR token'
			}
		}

		if (
			payload.typ !== PASS_TOKEN_TYPE ||
			payload.iss !== PASS_TOKEN_ISSUER ||
			payload.aud !== PASS_TOKEN_AUDIENCE ||
			!payload.jti ||
			!payload.sub ||
			!payload.eventId
		) {
			await this.logEntryAttempt({
				eventId: typeof decoded?.eventId === 'string' ? decoded.eventId : null,
				userId: typeof decoded?.sub === 'string' ? decoded.sub : null,
				turniketUserId: turniketUser.idUser,
				teamId: null,
				caseId: null,
				decision: EventEntryDecisionCode.DENY_INVALID,
				tokenJti: typeof decoded?.jti === 'string' ? decoded.jti : null,
				turniketLabelSnapshot: this.getTurniketLabel(turniketUser),
				userDisplayNameSnapshot: null,
				eventTitleSnapshot: null,
				wasFirstSuccessfulEntry: false,
				failureReason: 'Invalid token claims',
				scannerDeviceId: turniketDeviceId ?? null
			})

			return {
				code: EventEntryDecisionCode.DENY_INVALID,
				allow: false,
				message: 'Invalid token claims'
			}
		}

		const eventTurniket = await this.prisma.eventTurniket.findFirst({
			where: {
				eventId: payload.eventId,
				userId: turniketUser.idUser,
				isActive: true
			},
			select: {
				label: true
			}
		})

		if (!eventTurniket) {
			await this.logEntryAttempt({
				eventId: payload.eventId,
				userId: payload.sub,
				turniketUserId: turniketUser.idUser,
				teamId: null,
				caseId: null,
				decision: EventEntryDecisionCode.DENY_NOT_ELIGIBLE,
				tokenJti: payload.jti,
				turniketLabelSnapshot: this.getTurniketLabel(turniketUser),
				userDisplayNameSnapshot: null,
				eventTitleSnapshot: null,
				wasFirstSuccessfulEntry: false,
				failureReason: 'Turniket is not assigned to this event',
				scannerDeviceId: turniketDeviceId ?? null
			})

			return {
				code: EventEntryDecisionCode.DENY_NOT_ELIGIBLE,
				allow: false,
				message: 'Turniket is not assigned to this event'
			}
		}

		const ttlSeconds = payload.exp - Math.floor(Date.now() / 1000)
		if (ttlSeconds <= 0) {
			await this.logEntryAttempt({
				eventId: payload.eventId,
				userId: payload.sub,
				turniketUserId: turniketUser.idUser,
				teamId: null,
				caseId: null,
				decision: EventEntryDecisionCode.DENY_EXPIRED,
				tokenJti: payload.jti,
				turniketLabelSnapshot: this.getTurniketLabel(turniketUser),
				userDisplayNameSnapshot: null,
				eventTitleSnapshot: null,
				wasFirstSuccessfulEntry: false,
				failureReason: 'QR token expired',
				scannerDeviceId: turniketDeviceId ?? null
			})

			return {
				code: EventEntryDecisionCode.DENY_EXPIRED,
				allow: false,
				message: 'QR token expired'
			}
		}

		const eligibility = await this.getEligibility(payload.sub, payload.eventId)
		if (!eligibility.allowed) {
			await this.logEntryAttempt({
				eventId: eligibility.eventId,
				userId: eligibility.userId,
				turniketUserId: turniketUser.idUser,
				teamId: eligibility.teamId,
				caseId: eligibility.caseId,
				decision: EventEntryDecisionCode.DENY_NOT_ELIGIBLE,
				tokenJti: payload.jti,
				turniketLabelSnapshot: eventTurniket.label,
				userDisplayNameSnapshot: eligibility.userDisplayName,
				eventTitleSnapshot: eligibility.eventTitle,
				wasFirstSuccessfulEntry: false,
				failureReason: eligibility.reason,
				scannerDeviceId: turniketDeviceId ?? null
			})

			return {
				code: EventEntryDecisionCode.DENY_NOT_ELIGIBLE,
				allow: false,
				message: eligibility.reason
			}
		}

		await this.ensureRedisConnection()

		const setResult = await this.redis.set(
			this.getConsumedKey(payload.jti),
			JSON.stringify({
				sub: payload.sub,
				eventId: payload.eventId,
				usedAt: Date.now(),
				turniketDeviceId: turniketDeviceId ?? null
			}),
			'EX',
			ttlSeconds,
			'NX'
		)

		if (setResult !== 'OK') {
			await this.logEntryAttempt({
				eventId: eligibility.eventId,
				userId: eligibility.userId,
				turniketUserId: turniketUser.idUser,
				teamId: eligibility.teamId,
				caseId: eligibility.caseId,
				decision: EventEntryDecisionCode.DENY_REPLAY,
				tokenJti: payload.jti,
				turniketLabelSnapshot: eventTurniket.label,
				userDisplayNameSnapshot: eligibility.userDisplayName,
				eventTitleSnapshot: eligibility.eventTitle,
				wasFirstSuccessfulEntry: false,
				failureReason: 'QR token already used or revoked',
				scannerDeviceId: turniketDeviceId ?? null
			})

			return {
				code: EventEntryDecisionCode.DENY_REPLAY,
				allow: false,
				message: 'QR token already used or revoked'
			}
		}

		const previousSuccessfulEntries = await this.prisma.eventEntryLog.count({
			where: {
				eventId: eligibility.eventId,
				userId: eligibility.userId,
				decision: EventEntryDecisionCode.ALLOW
			}
		})

		await this.logEntryAttempt({
			eventId: eligibility.eventId,
			userId: eligibility.userId,
			turniketUserId: turniketUser.idUser,
			teamId: eligibility.teamId,
			caseId: eligibility.caseId,
			decision: EventEntryDecisionCode.ALLOW,
			tokenJti: payload.jti,
			turniketLabelSnapshot: eventTurniket.label,
			userDisplayNameSnapshot: eligibility.userDisplayName,
			eventTitleSnapshot: eligibility.eventTitle,
			wasFirstSuccessfulEntry: previousSuccessfulEntries === 0,
			failureReason: null,
			scannerDeviceId: turniketDeviceId ?? null
		})

		return {
			code: EventEntryDecisionCode.ALLOW,
			allow: true,
			message: 'Access granted'
		}
	}

	async getEntryPassState(userId: string, eventId: string) {
		const event = await this.prisma.event.findUnique({
			where: {
				idEvent: eventId
			},
			select: {
				idEvent: true,
				hasEntryPass: true
			}
		})

		if (!event) {
			throw new NotFoundException('Event not found')
		}

		if (!event.hasEntryPass) {
			return {
				enabled: false,
				isAvailable: false,
				reason: null
			}
		}

		const eligibility = await this.getEligibility(userId, eventId)

		return {
			enabled: true,
			isAvailable: eligibility.allowed,
			reason: eligibility.allowed ? null : eligibility.reason
		}
	}

	private async getEligibility(
		userId: string,
		eventId: string
	): Promise<PassEligibilityResult> {
		const participant = await this.prisma.userEvent.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			select: {
				caseId: true,
				user: {
					select: {
						idUser: true,
						name: true,
						surname: true,
						email: true
					}
				},
				event: {
					select: {
						idEvent: true,
						title: true,
						format: true,
						status: true,
						dataEnd: true,
						hasTeams: true,
						hasEntryPass: true
					}
				}
			}
		})

		if (!participant) {
			return {
				allowed: false,
				reason: 'Pass is available only for event participants',
				eventId,
				userId,
				eventTitle: null,
				userDisplayName: null,
				teamId: null,
				caseId: null
			}
		}

		if (!participant.event.hasEntryPass) {
			return {
				allowed: false,
				reason: 'Entry pass is disabled for this event',
				eventId: participant.event.idEvent,
				userId: participant.user.idUser,
				eventTitle: participant.event.title,
				userDisplayName: this.getUserDisplayName(participant.user),
				teamId: null,
				caseId: participant.caseId
			}
		}

		if (participant.event.format === EventFormat.ONLINE) {
			return {
				allowed: false,
				reason: 'Entry pass is not available for online events',
				eventId: participant.event.idEvent,
				userId: participant.user.idUser,
				eventTitle: participant.event.title,
				userDisplayName: this.getUserDisplayName(participant.user),
				teamId: null,
				caseId: participant.caseId
			}
		}

		if (
			participant.event.status === EventStatus.FINISHED ||
			new Date() >= participant.event.dataEnd
		) {
			return {
				allowed: false,
				reason: 'Event is already finished',
				eventId: participant.event.idEvent,
				userId: participant.user.idUser,
				eventTitle: participant.event.title,
				userDisplayName: this.getUserDisplayName(participant.user),
				teamId: null,
				caseId: participant.caseId
			}
		}

		if (!participant.event.hasTeams) {
			return {
				allowed: true,
				reason: null,
				eventId: participant.event.idEvent,
				userId: participant.user.idUser,
				eventTitle: participant.event.title,
				userDisplayName: this.getUserDisplayName(participant.user),
				teamId: null,
				caseId: participant.caseId
			}
		}

		const team = await this.prisma.team.findFirst({
			where: {
				eventId,
				user: {
					some: {
						userId
					}
				}
			},
			select: {
				idTeam: true,
				caseId: true,
				format: true
			}
		})

		if (!team) {
			return {
				allowed: false,
				reason: 'You must join or create a team to use the pass',
				eventId: participant.event.idEvent,
				userId: participant.user.idUser,
				eventTitle: participant.event.title,
				userDisplayName: this.getUserDisplayName(participant.user),
				teamId: null,
				caseId: participant.caseId
			}
		}

		if (team.format !== TeamFormat.OFFLINE) {
			return {
				allowed: false,
				reason: 'Entry pass is available only for offline teams',
				eventId: participant.event.idEvent,
				userId: participant.user.idUser,
				eventTitle: participant.event.title,
				userDisplayName: this.getUserDisplayName(participant.user),
				teamId: team.idTeam,
				caseId: team.caseId ?? participant.caseId
			}
		}

		return {
			allowed: true,
			reason: null,
			eventId: participant.event.idEvent,
			userId: participant.user.idUser,
			eventTitle: participant.event.title,
			userDisplayName: this.getUserDisplayName(participant.user),
			teamId: team.idTeam,
			caseId: team.caseId ?? participant.caseId
		}
	}

	private async logEntryAttempt(params: {
		eventId: string | null
		userId: string | null
		turniketUserId: string
		teamId: string | null
		caseId: string | null
		decision: EventEntryDecisionCode
		tokenJti: string | null
		turniketLabelSnapshot: string | null
		userDisplayNameSnapshot: string | null
		eventTitleSnapshot: string | null
		wasFirstSuccessfulEntry: boolean
		failureReason: string | null
		scannerDeviceId: string | null
	}) {
		let eventTitleSnapshot = params.eventTitleSnapshot
		let userDisplayNameSnapshot = params.userDisplayNameSnapshot

		if (params.eventId && !eventTitleSnapshot) {
			const event = await this.prisma.event.findUnique({
				where: {
					idEvent: params.eventId
				},
				select: {
					title: true
				}
			})

			eventTitleSnapshot = event?.title ?? null
		}

		if (params.userId && !userDisplayNameSnapshot) {
			const user = await this.prisma.user.findUnique({
				where: {
					idUser: params.userId
				},
				select: {
					name: true,
					surname: true,
					email: true
				}
			})

			userDisplayNameSnapshot = user ? this.getUserDisplayName(user) : null
		}

		await this.prisma.eventEntryLog.create({
			data: {
				eventId: params.eventId,
				userId: params.userId,
				turniketUserId: params.turniketUserId,
				teamId: params.teamId,
				caseId: params.caseId,
				decision: params.decision,
				tokenJti: params.tokenJti,
				turniketLabelSnapshot: params.turniketLabelSnapshot,
				userDisplayNameSnapshot,
				eventTitleSnapshot,
				wasFirstSuccessfulEntry: params.wasFirstSuccessfulEntry,
				failureReason: params.failureReason,
				scannerDeviceId: params.scannerDeviceId
			}
		})
	}

	private async requireRole(userId: string, role: Role) {
		const user = await this.prisma.user.findUnique({
			where: {
				idUser: userId
			},
			select: {
				idUser: true,
				email: true,
				name: true,
				role: true
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		if (user.role !== role) {
			throw new ForbiddenException('Not enough rights for this action')
		}

		return user
	}

	private async ensureRedisConnection() {
		try {
			if (this.redis.status !== 'ready') {
				await this.redis.connect()
			}
		} catch {
			throw new ServiceUnavailableException('Pass service is unavailable')
		}
	}

	private getConsumedKey(jti: string) {
		return `pass:consumed:${jti}`
	}

	private getUserDisplayName(user: {
		name?: string | null
		surname?: string | null
		email: string
	}) {
		const fullName = [user.surname, user.name].filter(Boolean).join(' ').trim()
		return fullName || user.email
	}

	private getTurniketLabel(user: {
		name?: string | null
		email: string
	}) {
		return user.name?.trim() || user.email
	}
}
