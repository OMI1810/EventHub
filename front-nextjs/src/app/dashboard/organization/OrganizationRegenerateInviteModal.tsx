'use client'

interface Props {
	expiresAt: string
	isPending: boolean
	onClose: () => void
	onConfirm: () => void
}

function formatInviteExpiry(expiresAt: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(new Date(expiresAt))
}

export function OrganizationRegenerateInviteModal({
	expiresAt,
	isPending,
	onClose,
	onConfirm
}: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Перегенерация кода
						</p>
						<h3 className="mt-3 text-2xl font-bold">
							Создать новый код приглашения?
						</h3>
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

				<div className="mt-6 rounded-2xl border border-amber-900/60 bg-amber-950/30 px-5 py-5">
					<p className="text-sm leading-6 text-zinc-200">
						Сейчас уже есть активный код приглашения. Он действует до{' '}
						{formatInviteExpiry(expiresAt)}. Если создать новый код, старый
						сразу перестанет работать.
					</p>
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
						className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isPending ? 'Создание...' : 'Да, создать новый код'}
					</button>
				</div>
			</div>
		</div>
	)
}
