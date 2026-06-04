'use client'

import { IUserEventOrganization } from '@/types/user-event.types'

interface Props {
	organization: IUserEventOrganization
	onClose: () => void
}

export function UserOrganizationContactsModal({
	organization,
	onClose
}: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Организация
						</p>
						<h3 className="mt-3 line-clamp-2 break-all text-2xl font-bold">
							{organization.name}
						</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
					>
						Закрыть
					</button>
				</div>

				<div className="mt-6 grid gap-4 md:grid-cols-2">
					<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Email
						</p>
						<p className="mt-3 break-all text-sm text-zinc-200">
							{organization.email || 'Не указано'}
						</p>
					</div>

					<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Контакт
						</p>
						<p className="mt-3 break-words text-sm text-zinc-200">
							{organization.contact || 'Не указано'}
						</p>
					</div>

					<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 md:col-span-2">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Адрес
						</p>
						<p className="mt-3 break-words text-sm text-zinc-200">
							{organization.address || 'Не указано'}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
