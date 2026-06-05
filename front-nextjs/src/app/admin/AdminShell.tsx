'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { AdminSidebar } from './AdminSidebar'

interface Props {
	children: ReactNode
}

export function AdminShell({ children }: Props) {
	const pathname = usePathname()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

	return (
		<div className="min-h-dvh bg-zinc-950 text-white lg:fixed lg:inset-0 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden">
			<div className="sticky top-0 z-30 flex items-center border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
				<button
					type="button"
					onClick={() => setIsSidebarOpen(true)}
					className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
					aria-label="Открыть меню"
				>
					Меню
				</button>
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
				<AdminSidebar
					className="h-dvh min-h-0 rounded-none border-y-0 border-l-0"
					onClose={() => setIsSidebarOpen(false)}
					onNavigate={() => setIsSidebarOpen(false)}
				/>
			</div>

			<div className="hidden lg:block">
				<AdminSidebar />
			</div>

			<div className="min-w-0 px-3 py-4 sm:px-4 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-8">
				{children}
			</div>
		</div>
	)
}
