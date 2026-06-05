'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { useProfile } from '@/hooks/useProfile'
import { getRoleHomePath } from '@/utils/get-role-home-path'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function DashboardEntry() {
	const router = useRouter()
	const { isLoading, user } = useProfile()

	useEffect(() => {
		if (isLoading) return

		router.replace(getRoleHomePath(user.role))
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
