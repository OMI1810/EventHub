'use client'

import { InviteRegenerateModal } from '@/app/invites/components/InviteRegenerateModal'

interface Props {
	expiresAt: string
	isPending: boolean
	onClose: () => void
	onConfirm: () => void
}

function formatInviteExpiry(expiresAt: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(new Date(expiresAt))
}

export function OrganizationRegenerateInviteModal({
	expiresAt,
	isPending,
	onClose,
	onConfirm
}: Props) {
	return (
		<InviteRegenerateModal
			label="Перегенерация кода"
			title="Создать новый код приглашения?"
			description={`Сейчас уже есть активный код приглашения. Он действует до ${formatInviteExpiry(expiresAt)}. Если создать новый код, старый сразу перестанет работать.`}
			confirmLabel="Да, создать новый код"
			isPending={isPending}
			onClose={onClose}
			onConfirm={onConfirm}
		/>
	)
}
