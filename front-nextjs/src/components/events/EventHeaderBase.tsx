'use client'

import { formatEventDateRange } from '@/utils/date-format'
import Link from 'next/link'
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
	detailsHref?: string
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
	actions,
	detailsHref
}: Props) {
	const descriptionText = description || 'Описание мероприятия отсутствует.'
	const shouldShowDetailsLink = Boolean(detailsHref)

	return (
		<section className="max-w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 text-white shadow-xl sm:p-8">
			<div className="flex min-w-0 max-w-full flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0 max-w-full flex-1 overflow-hidden">
					<button
						type="button"
						onClick={onOpenOrganization}
						className="max-w-full truncate text-left text-xs uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-300"
						title={organizationName}
					>
						{organizationName}
					</button>

					<h1 className="mt-3 line-clamp-3 max-w-full break-words text-2xl font-bold [overflow-wrap:anywhere] sm:line-clamp-2 sm:text-3xl">
						{title}
					</h1>
					<p className="mt-4 line-clamp-3 max-w-full break-words text-sm leading-7 text-zinc-400 [overflow-wrap:anywhere] lg:max-w-3xl">
						{descriptionText}
					</p>
					{shouldShowDetailsLink ? (
						<Link
							href={detailsHref!}
							className="mt-2 inline-flex text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200 hover:underline"
						>
							...ещё
						</Link>
					) : null}

					<div className="mt-5 flex max-w-full flex-wrap gap-2 overflow-hidden text-xs text-zinc-400">
						<span className="max-w-full break-words rounded-full border border-zinc-800 px-3 py-1 [overflow-wrap:anywhere]">
							{type}
						</span>
						<span className="max-w-full break-words rounded-full border border-zinc-800 px-3 py-1 [overflow-wrap:anywhere]">
							{format}
						</span>
						<span className="max-w-full break-words rounded-full border border-zinc-800 px-3 py-1 [overflow-wrap:anywhere]">
							{formatEventDateRange(dataStart, dataEnd)}
						</span>
					</div>
				</div>

				<div className="flex min-w-0 max-w-full flex-wrap gap-3 lg:shrink-0">
					{actions}
				</div>
			</div>
		</section>
	)
}
