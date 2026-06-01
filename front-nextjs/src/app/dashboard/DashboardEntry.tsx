'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { USER_PAGES } from '@/config/pages/user.config'
import { useProfile } from '@/hooks/useProfile'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function DashboardEntry() {
	const router = useRouter()
	const { isLoading, user } = useProfile()

	useEffect(() => {
		if (isLoading) return

		if (user.role === 'ORGANIZATOR') {
			router.replace(DASHBOARD_PAGES.ORGANIZATION)
			return
		}

		if (user.role === 'USER') {
			router.replace(USER_PAGES.HOME)
			return
		}

		router.replace(DASHBOARD_PAGES.PROFILE)
	}, [isLoading, router, user.role])

	return (
		<div className="mt-10">
			<MiniLoader
				width={150}
				height={150}
			/>
		</div>
	)
}
