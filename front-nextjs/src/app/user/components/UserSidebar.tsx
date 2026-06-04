'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { USER_PAGES } from '@/config/pages/user.config'
import userEventService from '@/services/user-event.service'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { twMerge } from 'tailwind-merge'

export function UserSidebar() {
	const pathname = usePathname()
	const { data, isLoading } = useQuery({
		queryKey: ['user-events', 'my'],
		queryFn: () => userEventService.getMyEvents()
	})

	const items = data?.data ?? []

	return (
		<aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
			<div className="space-y-5">
				<Link
					href={USER_PAGES.HOME}
					className={twMerge(
						'block rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors',
						pathname === USER_PAGES.HOME
							? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
							: 'border-zinc-700 text-zinc-100 hover:bg-zinc-800'
					)}
				>
					Главная
				</Link>

				<Link
					href={USER_PAGES.REQUESTS}
					className={twMerge(
						'block rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors',
						pathname === USER_PAGES.REQUESTS
							? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
							: 'border-zinc-700 text-zinc-100 hover:bg-zinc-800'
					)}
				>
					Мои заявки
				</Link>

				<div>
					<div className="mb-3 flex items-center justify-between">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Мои мероприятия
						</p>
						<Link
							href={DASHBOARD_PAGES.PROFILE}
							className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
						>
							Профиль
						</Link>
					</div>

					<div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
						{isLoading ? (
							<div className="flex justify-center py-8">
								<MiniLoader width={60} height={60} />
							</div>
						) : items.length ? (
							items.map(item => {
								const href = USER_PAGES.event(item.slug || item.idEvent)

								return (
									<Link
										key={item.idEvent}
										href={href}
										className={twMerge(
											'block rounded-2xl border px-4 py-3 text-sm transition-colors',
											pathname === href
												? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
												: 'border-zinc-800 text-zinc-200 hover:bg-zinc-800'
										)}
									>
										{item.title}
									</Link>
								)
							})
						) : (
							<div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-5 text-sm text-zinc-500">
								У вас нет зарегистрированных мероприятий.
							</div>
						)}
					</div>
				</div>
			</div>
		</aside>
	)
}
