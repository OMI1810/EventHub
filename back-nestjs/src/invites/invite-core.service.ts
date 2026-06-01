import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { createHash, randomBytes } from 'node:crypto'
import { BaseInvitePayload, CreateScopedInviteOptions } from './invite.types'

@Injectable()
export class InviteCoreService implements OnModuleDestroy {
	private readonly defaultTtlSeconds = 600
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

	async createScopedInvite<TPayload extends BaseInvitePayload>({
		scope,
		entityId,
		payload,
		ttlSeconds = this.defaultTtlSeconds
	}: CreateScopedInviteOptions<TPayload>) {
		await this.ensureRedisConnection()

		const activeKey = this.getActiveInviteKey(scope, entityId)
		const existingInviteHash = await this.redis.get(activeKey)

		if (existingInviteHash) {
			await this.redis.del(this.getInvitePayloadKey(scope, existingInviteHash), activeKey)
		}

		const code = this.generateInviteCode()
		const inviteHash = this.hashInviteCode(code)

		await this.redis.set(
			this.getInvitePayloadKey(scope, inviteHash),
			JSON.stringify(payload),
			'EX',
			ttlSeconds
		)

		await this.redis.set(activeKey, inviteHash, 'EX', ttlSeconds)

		return {
			code,
			expiresAt: payload.expiresAt
		}
	}

	async findScopedInviteByCode<TPayload extends BaseInvitePayload>(
		scope: string,
		code: string
	) {
		await this.ensureRedisConnection()

		const normalizedCode = this.normalizeInviteCode(code)

		if (!normalizedCode) {
			return null
		}

		const inviteHash = this.hashInviteCode(normalizedCode)
		const payload = await this.redis.get(this.getInvitePayloadKey(scope, inviteHash))

		if (!payload) {
			return null
		}

		return JSON.parse(payload) as TPayload
	}

	createExpiresAt(ttlSeconds = this.defaultTtlSeconds) {
		return new Date(Date.now() + ttlSeconds * 1000).toISOString()
	}

	createNonce() {
		return randomBytes(16).toString('hex')
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

	private normalizeInviteCode(code: string) {
		const normalized = code.trim().toUpperCase()
		return normalized || null
	}

	private getActiveInviteKey(scope: string, entityId: string) {
		return `${scope}_invite_active:${entityId}`
	}

	private getInvitePayloadKey(scope: string, inviteHash: string) {
		return `${scope}_invite:${inviteHash}`
	}
}
