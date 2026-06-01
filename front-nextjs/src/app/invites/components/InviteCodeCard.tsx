'use client'

interface Props {
	label: string
	title: string
	description: string
	code?: string
	expiresHint?: string
	emptyStateText: string
	generateLabel: string
	isPending: boolean
	onGenerate: () => void
	onCopy: () => void
	onOpenQr: () => void
}

export function InviteCodeCard({
	label,
	title,
	description,
	code,
	expiresHint,
	emptyStateText,
	generateLabel,
	isPending,
	onGenerate,
	onCopy,
	onOpenQr
}: Props) {
	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
					<h2 className="mt-3 text-2xl font-bold">{title}</h2>
					<p className="mt-3 text-sm text-zinc-400">{description}</p>
				</div>

				<button
					type="button"
					onClick={onGenerate}
					disabled={isPending}
					className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isPending ? 'Генерация...' : generateLabel}
				</button>
			</div>

			<div className="mt-6">
				{code ? (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
						<button
							type="button"
							onClick={onCopy}
							className="w-full rounded-2xl border border-dashed border-emerald-600/60 bg-zinc-950/70 px-5 py-5 text-left transition-colors hover:bg-zinc-800/70"
						>
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Активный код
							</p>
							<p className="mt-3 font-mono text-2xl font-bold tracking-[0.25em] text-emerald-400">
								{code}
							</p>
							{expiresHint ? (
								<p className="mt-4 text-sm text-zinc-400">{expiresHint}</p>
							) : null}
						</button>

						<button
							type="button"
							onClick={onOpenQr}
							className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-5 text-left transition-colors hover:bg-zinc-800/70"
						>
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								QR Code
							</p>
							<p className="mt-3 text-lg font-semibold text-zinc-100">Открыть QR</p>
							<p className="mt-4 text-sm text-zinc-400">
								Показать этот же код приглашения в виде QR для сканирования.
							</p>
						</button>
					</div>
				) : (
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-5">
						<p className="text-sm text-zinc-400">{emptyStateText}</p>
					</div>
				)}
			</div>
		</section>
	)
}
