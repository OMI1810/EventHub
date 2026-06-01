'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { USER_PAGES } from '@/config/pages/user.config'
import { useProfile } from '@/hooks/useProfile'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { UserSidebar } from './components/UserSidebar'

interface Props {
	children: ReactNode
}

export function UserShell({ children }: Props) {
	const router = useRouter()
	const { isLoading, user } = useProfile()

	useEffect(() => {
		if (isLoading) return

		if (user.role === 'ORGANIZATOR') {
			router.replace(DASHBOARD_PAGES.ORGANIZATION)
			return
		}

		if (user.role === 'ADMIN') {
			router.replace('/admin/profile')
			return
		}

		if (user.role !== 'USER') {
			router.replace(USER_PAGES.HOME)
		}
	}, [isLoading, router, user.role])

	if (isLoading || user.role !== 'USER') {
		return (
			<div className="mt-10 flex justify-center">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	return (
		<div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-white lg:grid-cols-[280px_minmax(0,1fr)]">
			<UserSidebar />
			<div className="min-w-0">{children}</div>
		</div>
	)
}
