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
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
			onClick={onClose}
		>
			<div
				className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-white shadow-2xl sm:rounded-3xl"
				onClick={event => event.stopPropagation()}
			>
				<div className="min-w-0 border-b border-zinc-800 px-4 py-4 sm:px-6">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Удаление аккаунта
					</p>
					<h3 className="mt-3 break-words text-2xl font-bold [overflow-wrap:anywhere]">
						{title}
					</h3>
				</div>

				<div className="overflow-y-auto px-4 py-5 sm:px-6">
					<div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-5 sm:px-5">
						<p className="break-words text-sm leading-6 text-zinc-200 [overflow-wrap:anywhere]">
							{description}
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
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
