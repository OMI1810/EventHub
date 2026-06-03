'use client'

interface ResultItem {
	idResult: string
	title: string
	place: number
	description?: string | null
	score?: number | null
	teamName?: string | null
	userName?: string | null
}

interface Props {
	results: ResultItem[]
}

export function EventResultsList({ results }: Props) {
	return (
		<div className="grid gap-4">
			{results.map(result => (
				<div
					key={result.idResult}
					className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4"
				>
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Место {result.place}
							</p>
							<h3 className="mt-2 text-lg font-semibold">{result.title}</h3>
						</div>
						{result.score !== null && result.score !== undefined ? (
							<span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
								{result.score} баллов
							</span>
						) : null}
					</div>

					<p className="mt-3 text-sm text-zinc-400">
						{result.teamName || result.userName || 'Участник не указан'}
					</p>

					{result.description ? (
						<p className="mt-3 text-sm leading-6 text-zinc-400">
							{result.description}
						</p>
					) : null}
				</div>
			))}
		</div>
	)
}
