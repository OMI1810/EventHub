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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4">
			<div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-white shadow-2xl sm:rounded-3xl">
				<div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Организация
						</p>
						<h3
							className="mt-3 line-clamp-2 text-2xl font-bold [overflow-wrap:anywhere]"
							title={organization.name}
						>
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

				<div className="grid gap-4 overflow-y-auto px-4 py-5 sm:px-6">
					<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Описание
						</p>
						<p className="mt-3 break-words text-sm text-zinc-200 [overflow-wrap:anywhere]">
							{organization.description || 'Описание не указано'}
						</p>
					</div>

					<div className="grid min-w-0 gap-4 md:grid-cols-2">
						<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5">
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Адрес
							</p>
							<p className="mt-3 break-words text-sm text-zinc-200 [overflow-wrap:anywhere]">
								{organization.address || 'Не указано'}
							</p>
						</div>

						<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5">
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Email владельца
							</p>
							<p className="mt-3 break-words text-sm text-zinc-200 [overflow-wrap:anywhere]">
								{organization.owner.email}
							</p>
						</div>
					</div>

					<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Контакт организации
						</p>
						<p className="mt-3 break-words text-sm text-zinc-200 [overflow-wrap:anywhere]">
							{organization.owner.contact || 'Не указано'}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
