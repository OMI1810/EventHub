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
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
			<div className="flex flex-wrap gap-2">
				{tabs.map(tab => (
					<button
						key={tab.key}
						type="button"
						onClick={() => onTabChange(tab.key)}
						className={
							activeTab === tab.key
								? 'rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300'
								: 'rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800'
						}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div className="mt-6 min-w-0">{children}</div>
		</section>
	)
}
