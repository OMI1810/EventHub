'use client'

import { InviteQrModal } from '@/app/invites/components/InviteQrModal'

interface Props {
	code: string
	onClose: () => void
}

export function OrganizationInviteQrModal({ code, onClose }: Props) {
	return (
		<InviteQrModal
			label="QR приглашения"
			title="QR-код приглашения администратора"
			code={code}
			onClose={onClose}
		/>
	)
}
