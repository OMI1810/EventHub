import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { EventStatus, Role } from '@prisma/client'

@Injectable()
export class UserEventsService {
	constructor(private readonly prisma: PrismaService) {}

	async getFeed(userId: string) {
		await this.requireRegularUser(userId)

		const events = await this.prisma.event.findMany({
			where: {
				status: {
					not: EventStatus.PRIVATE
				}
			},
			select: {
				idEvent: true,
				title: true,
				description: true,
				slug: true,
				type: true,
				format: true,
				status: true,
				dataStart: true,
				dataEnd: true,
				dataStartRegistration: true,
				dataEndRegistration: true,
				hasCases: true,
				hasTeams: true,
				hasMaterials: true,
				hasLoadedSolution: true,
				hasResualt: true,
				hasParticipantLimit: true,
				participantLimit: true,
				_count: {
					select: {
						participant: true
					}
				},
				organization: {
					select: {
						idOrganization: true,
						name: true
					}
				},
				participant: {
					where: {
						userId
					},
					select: {
						userId: true
					}
				}
			},
			orderBy: [{ dataStart: 'asc' }, { title: 'asc' }]
		})

		return events.map(event => {
			const isParticipating = event.participant.length > 0

			return {
				idEvent: event.idEvent,
				title: event.title,
				description: event.description,
				slug: event.slug,
				type: event.type,
				format: event.format,
				status: event.status,
				dataStart: event.dataStart,
				dataEnd: event.dataEnd,
				dataStartRegistration: event.dataStartRegistration,
				dataEndRegistration: event.dataEndRegistration,
				hasCases: event.hasCases,
				hasTeams: event.hasTeams,
				hasMaterials: event.hasMaterials,
				hasLoadedSolution: event.hasLoadedSolution,
				hasResualt: event.hasResualt,
				hasParticipantLimit: event.hasParticipantLimit,
				participantLimit: event.participantLimit,
				registeredUsersCount: event._count.participant,
				organization: event.organization,
				isParticipating,
				canParticipate: isParticipating
					? false
					: this.canParticipateInEvent({
							status: event.status,
							dataStartRegistration: event.dataStartRegistration,
							dataEndRegistration: event.dataEndRegistration,
							hasParticipantLimit: event.hasParticipantLimit,
							participantLimit: event.participantLimit,
							registeredUsersCount: event._count.participant
					  })
			}
		})
	}

	async getMyEvents(userId: string) {
		await this.requireRegularUser(userId)

		const relations = await this.prisma.userEvent.findMany({
			where: {
				userId
			},
			select: {
				createAt: true,
				event: {
					select: {
						idEvent: true,
						title: true,
						slug: true
					}
				}
			},
			orderBy: {
				createAt: 'desc'
			}
		})

		return relations.map(({ event, createAt }) => ({
			idEvent: event.idEvent,
			title: event.title,
			slug: event.slug,
			createAt
		}))
	}

	async participate(userId: string, eventId: string) {
		await this.requireRegularUser(userId)

		const event = await this.prisma.event.findUnique({
			where: {
				idEvent: eventId
			},
			select: {
				idEvent: true,
				status: true,
				dataStartRegistration: true,
				dataEndRegistration: true,
				hasParticipantLimit: true,
				participantLimit: true,
				_count: {
					select: {
						participant: true
					}
				}
			}
		})

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		const existingRelation = await this.prisma.userEvent.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			}
		})

		if (existingRelation) {
			throw new BadRequestException('Вы уже участвуете в этом мероприятии')
		}

		if (
			!this.canParticipateInEvent({
				status: event.status,
				dataStartRegistration: event.dataStartRegistration,
				dataEndRegistration: event.dataEndRegistration,
				hasParticipantLimit: event.hasParticipantLimit,
				participantLimit: event.participantLimit,
				registeredUsersCount: event._count.participant
			})
		) {
			throw new BadRequestException(
				'Сейчас регистрация на это мероприятие недоступна'
			)
		}

		await this.prisma.userEvent.create({
			data: {
				eventId,
				userId
			}
		})

		return { success: true }
	}

	private async requireRegularUser(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				idUser: userId
			},
			select: {
				idUser: true,
				role: true
			}
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		if (user.role !== Role.USER) {
			throw new ForbiddenException(
				'Этот раздел доступен только обычным пользователям'
			)
		}

		return user
	}

	private canParticipateInEvent(params: {
		status: EventStatus
		dataStartRegistration: Date | null
		dataEndRegistration: Date | null
		hasParticipantLimit: boolean
		participantLimit: number | null
		registeredUsersCount: number
	}) {
		if (
			params.status === EventStatus.PRIVATE ||
			params.status === EventStatus.FINISHED ||
			params.status === EventStatus.CLOSED_REGISTRATION
		) {
			return false
		}

		const now = new Date()

		if (params.dataStartRegistration && now < params.dataStartRegistration) {
			return false
		}

		if (params.dataEndRegistration && now > params.dataEndRegistration) {
			return false
		}

		if (
			params.hasParticipantLimit &&
			params.participantLimit !== null &&
			params.registeredUsersCount >= params.participantLimit
		) {
			return false
		}

		return true
	}
}
