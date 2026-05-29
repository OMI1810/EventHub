'use client'

import { ProfileEditForm } from '@/app/profile/components/ProfileEditForm'
import adminProfileService from '@/services/admin-profile.service'
import {
	IAdminProfile,
	IUpdateAdminProfileFormData
} from '@/types/admin-profile.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface Props {
	profile: IAdminProfile
	onCancel: () => void
}

export function AdminProfileEditForm({ profile, onCancel }: Props) {
	const queryClient = useQueryClient()

	const { mutate: mutateUpdate, isPending } = useMutation({
		mutationKey: ['admin', 'profile', 'update'],
		mutationFn: (data: IUpdateAdminProfileFormData) =>
			adminProfileService.updateProfile(data),
		onSuccess(response) {
			queryClient.setQueryData(['admin', 'profile'], response)
			queryClient.setQueryData(['profile'], response)
			toast.success('Данные администратора обновлены')
			onCancel()
		},
		onError() {
			toast.error('Не удалось обновить данные администратора')
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
