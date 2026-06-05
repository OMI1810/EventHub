'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { USER_PAGES } from '@/config/pages/user.config'
import userEventService from '@/services/user-event.service'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { twMerge } from 'tailwind-merge'

interface Props {
	className?: string
	onClose?: () => void
	onNavigate?: () => void
}

export function UserSidebar({ className, onClose, onNavigate }: Props) {
	const pathname = usePathname()
	const { data, isLoading } = useQuery({
		queryKey: ['user-events', 'my'],
		queryFn: () => userEventService.getMyEvents()
	})

	const items = data?.data ?? []

	return (
		<aside
			className={twMerge(
				'rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-l-0',
				className
			)}
		>
			<div className="flex h-full min-h-0 flex-1 flex-col gap-5">
				{onClose ? (
					<div className="flex items-center justify-between lg:hidden">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Навигация
						</p>
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
						>
							Закрыть
						</button>
					</div>
				) : null}

				<Link
					href={USER_PAGES.HOME}
					onClick={onNavigate}
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
					onClick={onNavigate}
					className={twMerge(
						'block rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors',
						pathname === USER_PAGES.REQUESTS
							? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
							: 'border-zinc-700 text-zinc-100 hover:bg-zinc-800'
					)}
				>
					Мои заявки
				</Link>

				<div className="flex min-h-0 flex-1 flex-col">
					<div className="mb-3 flex items-center justify-between gap-3">
						<p className="min-w-0 text-xs uppercase tracking-[0.2em] text-zinc-500">
							Мои мероприятия
						</p>
						<Link
							href={DASHBOARD_PAGES.PROFILE}
							onClick={onNavigate}
							className="shrink-0 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
						>
							Профиль
						</Link>
					</div>

					<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
										onClick={onNavigate}
										className={twMerge(
											'block min-w-0 rounded-2xl border px-4 py-3 text-sm transition-colors',
											pathname === href
												? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
												: 'border-zinc-800 text-zinc-200 hover:bg-zinc-800'
										)}
									>
										<span className="line-clamp-2 break-words">
											{item.title}
										</span>
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
