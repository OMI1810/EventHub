'use client'

import { IAdminOrganizationSummary } from '@/types/admin-organization.types'

interface Props {
	organizations: IAdminOrganizationSummary[]
	onSelect: (organization: IAdminOrganizationSummary) => void
	onAdd: () => void
}

export function AdminOrganizationsSection({
	organizations,
	onSelect,
	onAdd
}: Props) {
	const shouldScroll = organizations.length > 5

	return (
		<section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:rounded-3xl sm:p-6 lg:p-8">
			<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Организации
					</p>
					<h2 className="mt-3 break-words text-2xl font-bold [overflow-wrap:anywhere]">
						Список организаций
					</h2>
				</div>

				<button
					type="button"
					onClick={onAdd}
					className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
				>
					Добавиться в организацию
				</button>
			</div>

			<div className="mt-6">
				{organizations.length ? (
					<div
						className={`grid gap-3 ${
							shouldScroll ? 'max-h-[24rem] overflow-y-auto pr-1' : ''
						}`}
					>
						{organizations.map(organization => (
							<button
								key={organization.idOrganization}
								type="button"
								onClick={() => onSelect(organization)}
								className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 text-left transition-colors hover:bg-zinc-800/70 sm:px-5"
								title={organization.name}
							>
								<p className="line-clamp-2 text-base font-semibold text-zinc-100 [overflow-wrap:anywhere]">
									{organization.name}
								</p>
							</button>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-5 sm:px-5">
						<p className="break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
							Вы пока не состоите ни в одной организации.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
