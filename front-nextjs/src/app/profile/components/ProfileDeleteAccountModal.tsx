'use client'

interface Props {
	title: string
	description: string
	confirmLabel: string
	pendingLabel: string
	isPending?: boolean
	onClose: () => void
	onConfirm: () => void
}

export function ProfileDeleteAccountModal({
	title,
	description,
	confirmLabel,
	pendingLabel,
	isPending = false,
	onClose,
	onConfirm
}: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Удаление аккаунта
						</p>
						<h3 className="mt-3 text-2xl font-bold">{title}</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Нет
					</button>
				</div>

				<div className="mt-6 rounded-2xl border border-rose-900/60 bg-rose-950/30 px-5 py-5">
					<p className="text-sm leading-6 text-zinc-200">{description}</p>
				</div>

				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Отмена
					</button>

					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isPending ? pendingLabel : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
