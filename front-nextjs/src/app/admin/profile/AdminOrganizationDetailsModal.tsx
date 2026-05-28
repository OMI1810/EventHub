'use client'

import { IAdminOrganizationSummary } from '@/types/admin-organization.types'

interface Props {
	organization: IAdminOrganizationSummary
	onClose: () => void
}

export function AdminOrganizationDetailsModal({
	organization,
	onClose
}: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Организация
						</p>
						<h3 className="mt-3 text-2xl font-bold">{organization.name}</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
					>
						Закрыть
					</button>
				</div>

				<div className="mt-6 grid gap-4">
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Описание
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{organization.description || 'Описание не указано'}
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Адрес
							</p>
							<p className="mt-3 text-sm text-zinc-200">
								{organization.address || 'Не указано'}
							</p>
						</div>

						<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Email владельца
							</p>
							<p className="mt-3 text-sm text-zinc-200">
								{organization.owner.email}
							</p>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Контакт организации
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{organization.owner.contact || 'Не указано'}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
