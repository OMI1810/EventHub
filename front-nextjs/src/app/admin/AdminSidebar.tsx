'use client'

import { ADMIN_PAGES } from '@/config/pages/admin.config'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { twMerge } from 'tailwind-merge'

interface Props {
	className?: string
	onClose?: () => void
	onNavigate?: () => void
}

const NAV_ITEMS = [
	{
		href: ADMIN_PAGES.EVENTS,
		label: 'Мероприятия',
		description: 'Список мероприятий и переход к управлению'
	},
	{
		href: ADMIN_PAGES.EVENT_CREATE,
		label: 'Создать мероприятие',
		description: 'Новая рабочая область создания мероприятия'
	},
	{
		href: ADMIN_PAGES.PROFILE,
		label: 'Профиль',
		description: 'Личные данные, организации и поданные заявки'
	}
]

function isItemActive(pathname: string, href: string) {
	if (href === ADMIN_PAGES.EVENTS) {
		return (
			pathname === ADMIN_PAGES.EVENTS ||
			(pathname.startsWith(`${ADMIN_PAGES.EVENTS}/`) &&
				pathname !== ADMIN_PAGES.EVENT_CREATE)
		)
	}

	return pathname === href
}

export function AdminSidebar({ className, onClose, onNavigate }: Props) {
	const pathname = usePathname()
	const isEventWorkspace =
		pathname.startsWith(`${ADMIN_PAGES.EVENTS}/`) &&
		pathname !== ADMIN_PAGES.EVENT_CREATE

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

				<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Админ-панель
					</p>
					<p className="mt-3 line-clamp-2 break-words text-lg font-semibold text-zinc-100 [overflow-wrap:anywhere]">
						Управление EventHub
					</p>
				</div>

				<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
					{NAV_ITEMS.map(item => {
						const active = isItemActive(pathname, item.href)

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onNavigate}
								className={twMerge(
									'block w-full min-w-0 rounded-2xl border px-4 py-3 text-left transition-colors',
									active
										? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
										: 'border-zinc-800 text-zinc-100 hover:bg-zinc-800'
								)}
							>
								<p className="break-words text-sm font-semibold">
									{item.label}
								</p>
								<p className="mt-1 line-clamp-2 break-words text-xs text-zinc-500">
									{item.description}
								</p>
							</Link>
						)
					})}
				</div>

				{isEventWorkspace ? (
					<div className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Открыто сейчас
						</p>
						<p className="mt-2 text-sm font-semibold text-zinc-100">
							Конкретное мероприятие
						</p>
						<p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-500">
							Вы находитесь внутри рабочей области выбранного мероприятия.
						</p>
					</div>
				) : null}
			</div>
		</aside>
	)
}
