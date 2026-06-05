'use client'

import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export type OrganizationDashboardTab =
	| 'info'
	| 'admins'
	| 'events'
	| 'requests'

interface OrganizationSidebarProps {
	organizationName?: string
	organizationDescription?: string | null
	activeTab: OrganizationDashboardTab
	onChangeTab: (tab: OrganizationDashboardTab) => void
	className?: string
	onClose?: () => void
	onNavigate?: () => void
	footer?: ReactNode
}

const NAV_ITEMS: Array<{
	id: OrganizationDashboardTab
	label: string
	description: string
}> = [
	{
		id: 'info',
		label: 'Инфо',
		description: 'Описание, контакты и настройки организации'
	},
	{
		id: 'admins',
		label: 'Администраторы',
		description: 'Список администраторов организации'
	},
	{
		id: 'events',
		label: 'Мероприятия',
		description: 'Мероприятия, созданные от имени организации'
	},
	{
		id: 'requests',
		label: 'Приглашения / заявки',
		description: 'Код приглашения и входящие заявки'
	}
]

export function OrganizationSidebar({
	organizationName,
	activeTab,
	onChangeTab,
	className,
	onClose,
	onNavigate,
	footer
}: OrganizationSidebarProps) {
	const handleChangeTab = (tab: OrganizationDashboardTab) => {
		onChangeTab(tab)
		onNavigate?.()
	}

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
						Организация
					</p>
					<p
						title={organizationName}
						className="mt-3 line-clamp-2 break-words text-lg font-semibold text-zinc-100 [overflow-wrap:anywhere]"
					>
						{organizationName || 'Панель организации'}
					</p>
				</div>

				<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
					{NAV_ITEMS.map(item => (
						<button
							key={item.id}
							type="button"
							onClick={() => handleChangeTab(item.id)}
							className={twMerge(
								'block w-full min-w-0 rounded-2xl border px-4 py-3 text-left transition-colors',
								activeTab === item.id
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
						</button>
					))}
				</div>

				{footer ? <div className="shrink-0">{footer}</div> : null}
			</div>
		</aside>
	)
}
