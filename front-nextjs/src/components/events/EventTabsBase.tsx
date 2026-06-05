'use client'

import { ReactNode } from 'react'

interface TabItem<TKey extends string> {
	key: TKey
	label: string
}

interface Props<TKey extends string> {
	tabs: Array<TabItem<TKey>>
	activeTab: TKey
	onTabChange: (tab: TKey) => void
	children: ReactNode
}

export function EventTabsBase<TKey extends string>({
	tabs,
	activeTab,
	onTabChange,
	children
}: Props<TKey>) {
	return (
		<section className="max-w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-6">
			<div className="-mx-1 flex max-w-full gap-2 overflow-x-auto overflow-y-hidden px-1 pb-2">
				{tabs.map(tab => (
					<button
						key={tab.key}
						type="button"
						onClick={() => onTabChange(tab.key)}
						className={
							activeTab === tab.key
								? 'shrink-0 whitespace-nowrap rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300'
								: 'shrink-0 whitespace-nowrap rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800'
						}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div className="mt-6 min-w-0 max-w-full overflow-hidden">{children}</div>
		</section>
	)
}
