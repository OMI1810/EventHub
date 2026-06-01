export interface BaseInvitePayload {
	expiresAt: string
	nonce: string
}

export interface CreateScopedInviteOptions<TPayload extends BaseInvitePayload> {
	scope: string
	entityId: string
	payload: TPayload
	ttlSeconds?: number
}
