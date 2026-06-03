'use client'

import { twMerge } from 'tailwind-merge'

export type OrganizationDashboardTab =
	| 'info'
	| 'admins'
	| 'events'
	| 'requests'

interface OrganizationSidebarProps {
	organizationName?: string
	activeTab: OrganizationDashboardTab
	onChangeTab: (tab: OrganizationDashboardTab) => void
}

const NAV_ITEMS: Array<{
	id: OrganizationDashboardTab
	label: string
	description: string
}> = [
	{
		id: 'info',
		label: 'Инфо',
		description: 'Описание, контакты и редактирование организации'
	},
	{
		id: 'admins',
		label: 'Администраторы',
		description: 'Список администраторов организации'
	},
	{
		id: 'events',
		label: 'Мероприятия',
		description: 'Список мероприятий, созданных от имени организации'
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
	onChangeTab
}: OrganizationSidebarProps) {
	return (
		<aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
			<div className="space-y-5">
				<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Организация
					</p>
					<p className="mt-3 text-lg font-semibold text-zinc-100">
						{organizationName || 'Панель организации'}
					</p>
				</div>

				<div className="space-y-2">
					{NAV_ITEMS.map(item => (
						<button
							key={item.id}
							type="button"
							onClick={() => onChangeTab(item.id)}
							className={twMerge(
								'block w-full rounded-2xl border px-4 py-3 text-left transition-colors',
								activeTab === item.id
									? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
									: 'border-zinc-800 text-zinc-100 hover:bg-zinc-800'
							)}
						>
							<p className="text-sm font-semibold">{item.label}</p>
							<p className="mt-1 text-xs text-zinc-500">
								{item.description}
							</p>
						</button>
					))}
				</div>
			</div>
		</aside>
	)
}
