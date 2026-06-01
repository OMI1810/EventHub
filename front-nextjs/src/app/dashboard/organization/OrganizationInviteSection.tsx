'use client'

import { InviteCodeCard } from '@/app/invites/components/InviteCodeCard'
import organizationService from '@/services/organization.service'
import { IOrganizationInviteResponse } from '@/types/organization.types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { OrganizationInviteQrModal } from './OrganizationInviteQrModal'
import { OrganizationRegenerateInviteModal } from './OrganizationRegenerateInviteModal'

function formatInviteExpiry(expiresAt: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(new Date(expiresAt))
}

export function OrganizationInviteSection() {
	const [invite, setInvite] = useState<IOrganizationInviteResponse | null>(null)
	const [isQrModalOpen, setIsQrModalOpen] = useState(false)
	const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)

	const { mutate: mutateCreateInvite, isPending } = useMutation({
		mutationKey: ['organization', 'invite', 'create'],
		mutationFn: () => organizationService.createInviteForMyOrganization(),
		onSuccess(response) {
			setInvite(response.data)
			setIsQrModalOpen(false)
			setIsRegenerateModalOpen(false)
			toast.success('Код приглашения сгенерирован')
		},
		onError() {
			toast.error('Не удалось сгенерировать код приглашения')
		}
	})

	const handleGenerateInvite = () => {
		if (invite) {
			setIsRegenerateModalOpen(true)
			return
		}

		mutateCreateInvite()
	}

	const handleCopyInviteCode = async () => {
		if (!invite?.code) return

		try {
			await navigator.clipboard.writeText(invite.code)
			toast.success('Код приглашения скопирован')
		} catch {
			toast.error('Не удалось скопировать код приглашения')
		}
	}

	return (
		<>
			<InviteCodeCard
				label="Приглашение"
				title="Код приглашения администратора"
				description="Сгенерируйте одноразовый код для уже существующего аккаунта администратора. Если потеряете его, просто создайте новый."
				code={invite?.code}
				expiresHint={
					invite
						? `Действует до ${formatInviteExpiry(invite.expiresAt)}. Нажмите, чтобы скопировать.`
						: undefined
				}
				emptyStateText="На этой странице пока нет активного кода. Сгенерируйте его, чтобы показать здесь."
				generateLabel="Сгенерировать код"
				isPending={isPending}
				onGenerate={handleGenerateInvite}
				onCopy={handleCopyInviteCode}
				onOpenQr={() => setIsQrModalOpen(true)}
			/>

			{invite && isQrModalOpen ? (
				<OrganizationInviteQrModal
					code={invite.code}
					onClose={() => setIsQrModalOpen(false)}
				/>
			) : null}

			{invite && isRegenerateModalOpen ? (
				<OrganizationRegenerateInviteModal
					expiresAt={invite.expiresAt}
					isPending={isPending}
					onClose={() => setIsRegenerateModalOpen(false)}
					onConfirm={() => mutateCreateInvite()}
				/>
			) : null}
		</>
	)
}
