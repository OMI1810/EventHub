import { InviteCoreService } from '@/invites/invite-core.service'
import { BaseInvitePayload } from '@/invites/invite.types'
import { Injectable } from '@nestjs/common'

export interface TeamInvitePayload extends BaseInvitePayload {
	teamId: string
	eventId: string
	createdByUserId: string
}

@Injectable()
export class TeamInviteService {
	private readonly ttlSeconds = 600
	private readonly inviteScope = 'team'

	constructor(private readonly inviteCoreService: InviteCoreService) {}

	async createTeamInvite(
		teamId: string,
		eventId: string,
		createdByUserId: string
	) {
		const expiresAt = this.inviteCoreService.createExpiresAt(this.ttlSeconds)

		return this.inviteCoreService.createScopedInvite({
			scope: this.inviteScope,
			entityId: teamId,
			ttlSeconds: this.ttlSeconds,
			payload: {
				teamId,
				eventId,
				createdByUserId,
				expiresAt,
				nonce: this.inviteCoreService.createNonce()
			}
		})
	}

	async findActiveInviteByCode(code: string) {
		return this.inviteCoreService.findScopedInviteByCode<TeamInvitePayload>(
			this.inviteScope,
			code
		)
	}
}
