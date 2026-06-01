import { InviteCoreService } from '@/invites/invite-core.service'
import { BaseInvitePayload } from '@/invites/invite.types'
import { Injectable } from '@nestjs/common'

export interface OrganizationInvitePayload extends BaseInvitePayload {
	organizationId: string
	createdByUserId: string
}

@Injectable()
export class OrganizationInviteService {
	private readonly ttlSeconds = 600
	private readonly inviteScope = 'organization'

	constructor(private readonly inviteCoreService: InviteCoreService) {}

	async createOrganizationInvite(
		organizationId: string,
		createdByUserId: string
	) {
		const expiresAt = this.inviteCoreService.createExpiresAt(this.ttlSeconds)

		const payload: OrganizationInvitePayload = {
			organizationId,
			createdByUserId,
			expiresAt,
			nonce: this.inviteCoreService.createNonce()
		}

		return this.inviteCoreService.createScopedInvite({
			scope: this.inviteScope,
			entityId: organizationId,
			payload,
			ttlSeconds: this.ttlSeconds
		})
	}

	async findActiveInviteByCode(code: string) {
		return this.inviteCoreService.findScopedInviteByCode<OrganizationInvitePayload>(
			this.inviteScope,
			code
		)
	}
}
