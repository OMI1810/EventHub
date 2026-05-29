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
	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Организации
					</p>
					<h2 className="mt-3 text-2xl font-bold">Список организаций</h2>
				</div>

				<button
					type="button"
					onClick={onAdd}
					className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
				>
					Добавить в список организаций
				</button>
			</div>

			<div className="mt-6">
				{organizations.length ? (
					<div className="grid gap-3">
						{organizations.map(organization => (
							<button
								key={organization.idOrganization}
								type="button"
								onClick={() => onSelect(organization)}
								className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 text-left transition-colors hover:bg-zinc-800/70"
							>
								<p className="text-base font-semibold text-zinc-100">
									{organization.name}
								</p>
							</button>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-5">
						<p className="text-sm text-zinc-400">
							Вы пока не состоите ни в одной организации.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
