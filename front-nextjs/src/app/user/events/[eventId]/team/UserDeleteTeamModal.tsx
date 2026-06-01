'use client'

interface Props {
	isPending: boolean
	onClose: () => void
	onConfirm: () => void
}

export function UserDeleteTeamModal({ isPending, onClose, onConfirm }: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Удаление команды</p>
				<h3 className="mt-3 text-2xl font-bold">Удалить команду?</h3>
				<p className="mt-4 text-sm leading-6 text-zinc-400">
					Команда, её участники и ожидающие заявки будут отвязаны от этого мероприятия.
				</p>

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
						{isPending ? 'Удаляем...' : 'Удалить'}
					</button>
				</div>
			</div>
		</div>
	)
}
