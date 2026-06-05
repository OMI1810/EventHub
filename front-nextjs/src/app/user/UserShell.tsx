'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { USER_PAGES } from '@/config/pages/user.config'
import { useProfile } from '@/hooks/useProfile'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { UserSidebar } from './components/UserSidebar'

interface Props {
	children: ReactNode
}

export function UserShell({ children }: Props) {
	const router = useRouter()
	const pathname = usePathname()
	const { isLoading, user } = useProfile()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

		if (user.role === 'TURNIKET') {
			router.replace('/turniket')
			return
		}

		if (user.role !== 'USER') {
			router.replace(USER_PAGES.HOME)
		}
	}, [isLoading, router, user.role])

	useEffect(() => {
		setIsSidebarOpen(false)
	}, [pathname])

	useEffect(() => {
		if (!isSidebarOpen) return

		const originalOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		return () => {
			document.body.style.overflow = originalOverflow
		}
	}, [isSidebarOpen])

	if (isLoading || user.role !== 'USER') {
		return (
			<div className="mt-10 flex justify-center">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	return (
		<div className="min-h-dvh bg-zinc-950 text-white lg:fixed lg:inset-0 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden">
			<div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
				<button
					type="button"
					onClick={() => setIsSidebarOpen(true)}
					className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
					aria-label="Открыть меню"
				>
					Меню
				</button>
				<p className="min-w-0 truncate text-sm font-semibold text-zinc-300">
					Панель пользователя
				</p>
			</div>

			{isSidebarOpen ? (
				<button
					type="button"
					aria-label="Закрыть меню"
					onClick={() => setIsSidebarOpen(false)}
					className="fixed inset-0 z-40 bg-black/70 lg:hidden"
				/>
			) : null}

			<div
				className={twMerge(
					'fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] transform transition-transform duration-200 lg:hidden',
					isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
				)}
			>
				<UserSidebar
					className="h-dvh min-h-0 rounded-none border-y-0 border-l-0"
					onClose={() => setIsSidebarOpen(false)}
					onNavigate={() => setIsSidebarOpen(false)}
				/>
			</div>

			<div className="hidden lg:block">
				<UserSidebar />
			</div>

			<div className="min-w-0 px-3 py-4 sm:px-4 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-8">
				{children}
			</div>
		</div>
	)
}
