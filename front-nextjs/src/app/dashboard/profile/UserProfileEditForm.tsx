'use client'

import { ProfileEditForm } from '@/app/profile/components/ProfileEditForm'
import userService from '@/services/user.service'
import { IProfile, IUpdateProfileFormData } from '@/types/profile.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface Props {
	profile: IProfile
	onCancel: () => void
}

export function UserProfileEditForm({ profile, onCancel }: Props) {
	const queryClient = useQueryClient()

	const { mutate: mutateUpdate, isPending } = useMutation({
		mutationKey: ['user', 'profile', 'update'],
		mutationFn: (data: IUpdateProfileFormData) => userService.updateProfile(data),
		onSuccess(response) {
			queryClient.setQueryData(['profile'], response)
			toast.success('Данные пользователя обновлены')
			onCancel()
		},
		onError() {
			toast.error('Не удалось обновить данные пользователя')
		}
	})

	return (
		<ProfileEditForm
			profile={profile}
			isPending={isPending}
			onCancel={onCancel}
			onSubmit={data => mutateUpdate(data)}
		/>
	)
}
