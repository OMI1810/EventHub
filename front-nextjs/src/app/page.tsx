'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { GUEST_PAGES } from '@/config/pages/guest.config'
import { useProfile } from '@/hooks/useProfile'
import { getRoleHomePath } from '@/utils/get-role-home-path'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
	const router = useRouter()
	const { isLoading, user } = useProfile()

	useEffect(() => {
		if (isLoading) return

		if (!user?.idUser) {
			router.replace(GUEST_PAGES.HOME)
			return
		}

		router.replace(getRoleHomePath(user.role))
	}, [isLoading, router, user?.idUser, user?.role])

	return (
		<div className="mt-10">
			<MiniLoader
				width={150}
				height={150}
			/>
		</div>
	)
}
