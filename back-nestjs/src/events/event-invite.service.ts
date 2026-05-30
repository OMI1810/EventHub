import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { createHash, randomBytes, randomUUID } from "node:crypto";

export interface EventInvitePayload {
  eventId: string;
  createdByUserId: string;
  expiresAt: string;
  nonce: string;
}

@Injectable()
export class EventInviteService implements OnModuleDestroy {
  private readonly ttlSeconds = 600;
  private readonly redis: Redis;
  private readonly inviteSecret: string;

  constructor(private readonly configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>("REDIS_URL") ?? "redis://127.0.0.1:6379";

    this.inviteSecret =
      this.configService.get<string>("INVITE_SECRET") ??
      this.configService.get<string>("JWT_SECRET") ??
      "development-invite-secret";

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async createEventInvite(eventId: string, createdByUserId: string) {
    await this.ensureRedisConnection();

    const activeKey = this.getEventActiveInviteKey(eventId);
    const existingInviteHash = await this.redis.get(activeKey);

    if (existingInviteHash) {
      await this.redis.del(this.getInvitePayloadKey(existingInviteHash), activeKey);
    }

    const code = this.generateInviteCode();
    const inviteHash = this.hashInviteCode(code);
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000).toISOString();

    const payload: EventInvitePayload = {
      eventId,
      createdByUserId,
      expiresAt,
      nonce: randomUUID(),
    };

    await this.redis.set(
      this.getInvitePayloadKey(inviteHash),
      JSON.stringify(payload),
      "EX",
      this.ttlSeconds,
    );

    await this.redis.set(activeKey, inviteHash, "EX", this.ttlSeconds);

    return {
      code,
      expiresAt,
    };
  }

  async findActiveInviteByCode(code: string) {
    await this.ensureRedisConnection();

    const normalizedCode = this.normalizeInviteCode(code);

    if (!normalizedCode) {
      return null;
    }

    const inviteHash = this.hashInviteCode(normalizedCode);
    const payload = await this.redis.get(this.getInvitePayloadKey(inviteHash));

    if (!payload) {
      return null;
    }

    return JSON.parse(payload) as EventInvitePayload;
  }

  private async ensureRedisConnection() {
    try {
      if (this.redis.status !== "ready") {
        await this.redis.connect();
      }
    } catch {
      throw new ServiceUnavailableException(
        "Сервис приглашений недоступен. Проверьте подключение к Redis.",
      );
    }
  }

  private generateInviteCode() {
    const raw = randomBytes(4).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  }

  private hashInviteCode(code: string) {
    return createHash("sha256")
      .update(`${code}:event:${this.inviteSecret}`)
      .digest("hex");
  }

  private normalizeInviteCode(code: string) {
    const normalized = code.trim().toUpperCase();
    return normalized || null;
  }

  private getEventActiveInviteKey(eventId: string) {
    return `event_invite_active:${eventId}`;
  }

  private getInvitePayloadKey(inviteHash: string) {
    return `event_invite:${inviteHash}`;
  }
}
