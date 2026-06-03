'use client'

import { ReactNode } from 'react'

interface Props {
	organizationName: string
	title: string
	description?: string | null
	type: string
	format: string
	dataStart: string
	dataEnd: string
	onOpenOrganization: () => void
	actions: ReactNode
}

function formatDateRange(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(
		new Date(end)
	)}`
}

export function EventHeaderBase({
	organizationName,
	title,
	description,
	type,
	format,
	dataStart,
	dataEnd,
	onOpenOrganization,
	actions
}: Props) {
	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0">
					<button
						type="button"
						onClick={onOpenOrganization}
						className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-300"
					>
						{organizationName}
					</button>

					<h1 className="mt-3 text-3xl font-bold">{title}</h1>
					<p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
						{description || 'Описание мероприятия отсутствует.'}
					</p>

					<div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400">
						<span className="rounded-full border border-zinc-800 px-3 py-1">
							{type}
						</span>
						<span className="rounded-full border border-zinc-800 px-3 py-1">
							{format}
						</span>
						<span className="rounded-full border border-zinc-800 px-3 py-1">
							{formatDateRange(dataStart, dataEnd)}
						</span>
					</div>
				</div>

				<div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
			</div>
		</section>
	)
}
