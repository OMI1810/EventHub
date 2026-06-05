'use client'

import { InviteSectionCard } from '@/app/invites/components/InviteSectionCard'
import organizationService from '@/services/organization.service'
import { IOrganizationInviteResponse } from '@/types/organization.types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'

function formatInviteExpiry(expiresAt: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(new Date(expiresAt))
}

export function OrganizationInviteSection() {
	const [invite, setInvite] = useState<IOrganizationInviteResponse | null>(null)

	const { mutate: mutateCreateInvite, isPending } = useMutation({
		mutationKey: ['organization', 'invite', 'create'],
		mutationFn: () => organizationService.createInviteForMyOrganization(),
		onSuccess(response) {
			setInvite(response.data)
			toast.success('Код приглашения сгенерирован')
		},
		onError() {
			toast.error('Не удалось сгенерировать код приглашения')
		}
	})

	return (
		<InviteSectionCard
			label="Приглашение"
			title="Код приглашения администратора"
			description="Сгенерируйте одноразовый код для уже существующего аккаунта администратора. После ввода или сканирования кода он сможет отправить заявку на вступление в организацию."
			invite={invite}
			expiresHint={
				invite
					? `Действует до ${formatInviteExpiry(invite.expiresAt)}. Нажмите, чтобы скопировать.`
					: undefined
			}
			emptyStateText="Активного кода пока нет. Сгенерируйте его, чтобы показать будущему администратору."
			generateLabel="Сгенерировать код"
			isPending={isPending}
			qrLabel="QR приглашения"
			qrTitle="QR-код приглашения администратора"
			regenerateLabel="Перегенерация кода"
			regenerateTitle="Создать новый код приглашения?"
			regenerateDescription={
				invite
					? `Сейчас уже есть активный код приглашения. Он действует до ${formatInviteExpiry(invite.expiresAt)}. Если создать новый код, старый сразу перестанет работать.`
					: undefined
			}
			regenerateConfirmLabel="Да, создать новый код"
			copySuccessMessage="Код приглашения скопирован"
			copyErrorMessage="Не удалось скопировать код приглашения"
			onGenerate={() => mutateCreateInvite()}
		/>
	)
}
