'use client'

import { ProfileDeleteAccountModal } from '@/app/profile/components/ProfileDeleteAccountModal'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import authTokenService from '@/services/auth/auth-token.service'
import authService from '@/services/auth/auth.service'
import userService from '@/services/user.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
	onClose: () => void
}

export function UserDeleteAccountModal({ onClose }: Props) {
	const router = useRouter()

	const { mutate: mutateDeleteProfile, isPending } = useMutation({
		mutationKey: ['user', 'profile', 'delete'],
		mutationFn: () => userService.deleteProfile(),
		async onSuccess() {
			try {
				await authService.logout()
			} catch {
				// The account is already deleted, so we still clear local auth state.
			}

			authTokenService.removeAccessToken()
			toast.success('Аккаунт пользователя удалён')
			router.push(PUBLIC_PAGES.LOGIN)
		},
		onError() {
			toast.error('Не удалось удалить аккаунт пользователя')
		}
	})

	return (
		<ProfileDeleteAccountModal
			title="Удалить аккаунт пользователя"
			description="Вы точно хотите удалить аккаунт пользователя? Это действие удалит сам аккаунт, все привязки к командам и все ваши заявки на участие."
			confirmLabel="Да, удалить"
			pendingLabel="Удаление..."
			isPending={isPending}
			onClose={onClose}
			onConfirm={() => mutateDeleteProfile()}
		/>
	)
}
