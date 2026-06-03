'use client'

interface Props {
	holder?: string | null
	title: string
	description?: string | null
	teamLimit?: number | null
	occupiedPlaces?: number | null
	dateForStartSelected: string
	dateForEndSelected: string
	actionLabel: string
	onAction: () => void
	disabled?: boolean
}

function formatCaseSchedule(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`
}

export function EventCaseCard({
	holder,
	title,
	description,
	teamLimit,
	occupiedPlaces,
	dateForStartSelected,
	dateForEndSelected,
	actionLabel,
	onAction,
	disabled
}: Props) {
	return (
		<article className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						{holder || 'Кейсодержатель не указан'}
					</p>
					<h3 className="mt-3 text-xl font-bold">{title}</h3>
				</div>

				{teamLimit ? (
					<span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
						{occupiedPlaces ?? 0}/{teamLimit}
					</span>
				) : null}
			</div>

			<p className="mt-4 text-sm leading-6 text-zinc-400">
				{description || 'Описание кейса отсутствует.'}
			</p>

			<p className="mt-4 text-xs text-zinc-500">
				{formatCaseSchedule(dateForStartSelected, dateForEndSelected)}
			</p>

			<div className="mt-5 flex flex-wrap gap-3">
				<button
					type="button"
					onClick={onAction}
					disabled={disabled}
					className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{actionLabel}
				</button>
			</div>
		</article>
	)
}
