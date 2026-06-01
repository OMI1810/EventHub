'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { useProfile } from '@/hooks/useProfile'
import { IProfile } from '@/types/profile.types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserProfilePage } from './UserProfilePage'

export function ProfileInfo() {
	const router = useRouter()
	const { isLoading, refetch, user } = useProfile()

	useEffect(() => {
		if (isLoading) return

		if (user.role === 'ORGANIZATOR') {
			router.replace(DASHBOARD_PAGES.ORGANIZATION)
			return
		}

		if (user.role === 'ADMIN') {
			router.replace('/admin/profile')
		}
	}, [isLoading, router, user.role])

	if (isLoading) {
		return (
			<div className="mt-10">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	if (user.role === 'ORGANIZATOR' || user.role === 'ADMIN' || !user.role) {
		return (
			<div className="mt-10">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	if (!user.idUser || !user.email) {
		return (
			<div className="mt-10">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	const profile: IProfile = {
		idUser: user.idUser,
		email: user.email,
		role: user.role,
		name: user.name,
		surname: user.surname,
		patronymic: user.patronymic,
		phone: user.phone,
		contact: user.contact,
		verificationToken: user.verificationToken
	}

	return <UserProfilePage profile={profile} refetchProfile={refetch} />
}
