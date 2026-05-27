import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { createHash, randomBytes, randomUUID } from 'node:crypto'

interface OrganizationInvitePayload {
	organizationId: string
	createdByUserId: string
	expiresAt: string
	nonce: string
}

@Injectable()
export class OrganizationInviteService implements OnModuleDestroy {
	private readonly ttlSeconds = 600
	private readonly redis: Redis
	private readonly inviteSecret: string

	constructor(private readonly configService: ConfigService) {
		const redisUrl =
			this.configService.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379'

		this.inviteSecret =
			this.configService.get<string>('INVITE_SECRET') ??
			this.configService.get<string>('JWT_SECRET') ??
			'development-invite-secret'

		this.redis = new Redis(redisUrl, {
			maxRetriesPerRequest: 1,
			enableReadyCheck: true,
			lazyConnect: true
		})
	}

	async onModuleDestroy() {
		await this.redis.quit()
	}

	async createOrganizationInvite(
		organizationId: string,
		createdByUserId: string
	) {
		await this.ensureRedisConnection()

		const activeKey = this.getOrganizationActiveInviteKey(organizationId)
		const existingInviteHash = await this.redis.get(activeKey)

		if (existingInviteHash) {
			await this.redis.del(this.getInvitePayloadKey(existingInviteHash), activeKey)
		}

		const code = this.generateInviteCode()
		const inviteHash = this.hashInviteCode(code)
		const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000).toISOString()

		const payload: OrganizationInvitePayload = {
			organizationId,
			createdByUserId,
			expiresAt,
			nonce: randomUUID()
		}

		await this.redis.set(
			this.getInvitePayloadKey(inviteHash),
			JSON.stringify(payload),
			'EX',
			this.ttlSeconds
		)

		await this.redis.set(activeKey, inviteHash, 'EX', this.ttlSeconds)

		return {
			code,
			expiresAt
		}
	}

	private async ensureRedisConnection() {
		try {
			if (this.redis.status !== 'ready') {
				await this.redis.connect()
			}
		} catch {
			throw new ServiceUnavailableException(
				'Сервис приглашений недоступен. Проверьте подключение к Redis.'
			)
		}
	}

	private generateInviteCode() {
		const raw = randomBytes(4).toString('hex').toUpperCase()
		return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`
	}

	private hashInviteCode(code: string) {
		return createHash('sha256')
			.update(`${code}:${this.inviteSecret}`)
			.digest('hex')
	}

	private getOrganizationActiveInviteKey(organizationId: string) {
		return `organization_invite_active:${organizationId}`
	}

	private getInvitePayloadKey(inviteHash: string) {
		return `organization_invite:${inviteHash}`
	}
}
