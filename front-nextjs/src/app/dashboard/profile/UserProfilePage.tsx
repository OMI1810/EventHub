'use client'

import { ProfileInfoCard } from '@/app/profile/components/ProfileInfoCard'
import { ProfileLayout } from '@/app/profile/components/ProfileLayout'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import authService from '@/services/auth/auth.service'
import { IProfile } from '@/types/profile.types'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { UserDeleteAccountModal } from './UserDeleteAccountModal'
import { UserProfileEditForm } from './UserProfileEditForm'

interface Props {
	profile: IProfile
	refetchProfile: () => void
}

export function UserProfilePage({ profile, refetchProfile }: Props) {
	const router = useRouter()
	const [isEditMode, setIsEditMode] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isPending, startTransition] = useTransition()

	const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation({
		mutationKey: ['logout'],
		mutationFn: () => authService.logout(),
		onSuccess() {
			refetchProfile()
			startTransition(() => {
				router.push(PUBLIC_PAGES.LOGIN)
			})
		}
	})

	return (
		<ProfileLayout
			onLogout={() => mutateLogout()}
			isLogoutLoading={isLogoutPending || isPending}
		>
			<ProfileInfoCard
				profile={profile}
				title="Профиль пользователя"
				subtitle="Личный профиль пользователя."
				isEditMode={isEditMode}
				onToggleEdit={() => setIsEditMode(current => !current)}
				onDelete={() => setIsDeleteModalOpen(true)}
				editForm={
					isEditMode ? (
						<UserProfileEditForm
							profile={profile}
							onCancel={() => setIsEditMode(false)}
						/>
					) : null
				}
			/>

			{isDeleteModalOpen ? (
				<UserDeleteAccountModal
					onClose={() => setIsDeleteModalOpen(false)}
				/>
			) : null}
		</ProfileLayout>
	)
}
