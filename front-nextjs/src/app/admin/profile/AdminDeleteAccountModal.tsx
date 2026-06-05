'use client'

import { ProfileDeleteAccountModal } from '@/app/profile/components/ProfileDeleteAccountModal'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import adminProfileService from '@/services/admin-profile.service'
import authTokenService from '@/services/auth/auth-token.service'
import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
	onClose: () => void
}

export function AdminDeleteAccountModal({ onClose }: Props) {
	const router = useRouter()

	const { mutate: mutateDeleteProfile, isPending } = useMutation({
		mutationKey: ['admin', 'profile', 'delete'],
		mutationFn: () => adminProfileService.deleteProfile(),
		async onSuccess() {
			try {
				await authService.logout()
			} catch {
				// The account is already deleted, so we still clear local auth state.
			}

			authTokenService.removeAccessToken()
			toast.success('Аккаунт администратора удалён')
			router.push(PUBLIC_PAGES.LOGIN)
		},
		onError() {
			toast.error('Не удалось удалить аккаунт администратора')
		}
	})

	return (
		<ProfileDeleteAccountModal
			title="Удалить аккаунт администратора"
			description="Вы точно хотите удалить аккаунт администратора? Это действие удалит сам аккаунт, все связи с организациями и все поданные заявки на вступление."
			confirmLabel="Да, удалить"
			pendingLabel="Удаление..."
			isPending={isPending}
			onClose={onClose}
			onConfirm={() => mutateDeleteProfile()}
		/>
	)
}
