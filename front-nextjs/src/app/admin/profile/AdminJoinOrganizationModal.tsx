'use client'

import { JoinByCodeModal } from '@/app/invites/components/JoinByCodeModal'
import adminOrganizationService from '@/services/admin-organization.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

interface Props {
	onClose: () => void
}

export function AdminJoinOrganizationModal({ onClose }: Props) {
	const queryClient = useQueryClient()

	const { mutate: mutateCreateRequest, isPending } = useMutation({
		mutationKey: ['admin', 'organization-requests', 'create'],
		mutationFn: (code: string) =>
			adminOrganizationService.createOrganizationRequest({ code }),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['admin', 'organization-requests']
			})
			toast.success('Заявка на вступление в организацию отправлена')
			onClose()
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message =
				error?.response?.data?.message ??
				'Не удалось отправить заявку на вступление'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	return (
		<JoinByCodeModal
			label="Организации"
			title="Вступление в организацию"
			description="Введите код приглашения вручную или откройте сканер QR-кода."
			codeLabel="Код приглашения"
			codePlaceholder="Например, A1B2-C3D4"
			emptyHint="Вы можете ввести код вручную или считать его через камеру."
			filledHint="Код можно отредактировать вручную перед отправкой."
			scanButtonLabel="Отсканировать QR-код"
			scannerTitle="Сканирование QR-кода"
			submitLabel="Отправить заявку"
			isPending={isPending}
			onClose={onClose}
			onDetected={() => {
				toast.success('QR-код считан. Проверьте код и отправьте заявку.')
			}}
			onSubmit={code => mutateCreateRequest(code)}
		/>
	)
}
