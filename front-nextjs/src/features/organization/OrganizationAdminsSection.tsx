'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { useOrganizationAdmins } from '@/hooks/useOrganizationAdmins'
import { IOrganizationAdminSummary } from '@/types/organization.types'
import { useState } from 'react'
import { OrganizationAdminDetailsModal } from './OrganizationAdminDetailsModal'
import { getOrganizationAdminDisplayName } from './organization.helpers'

export function OrganizationAdminsSection() {
	const { admins, isLoading } = useOrganizationAdmins()
	const [selectedAdmin, setSelectedAdmin] =
		useState<IOrganizationAdminSummary | null>(null)

	return (
		<section className="max-w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-8">
			<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
				Администраторы организации
			</p>
			<h1 className="mt-3 break-words text-3xl font-bold [overflow-wrap:anywhere]">
				Список администраторов
			</h1>
			<p className="mt-4 max-w-3xl break-words text-sm text-zinc-300 [overflow-wrap:anywhere]">
				Здесь отображаются все администраторы, которые уже работают от имени
				этой организации.
			</p>

			{isLoading ? (
				<div className="mt-6">
					<MiniLoader width={80} height={80} />
				</div>
			) : admins.length === 0 ? (
				<p className="mt-6 text-sm text-zinc-400">
					В этой организации пока нет администраторов.
				</p>
			) : (
				<div className="mt-6 space-y-3">
					{admins.map(admin => {
						const displayName = getOrganizationAdminDisplayName(admin)

						return (
							<button
								key={admin.idUser}
								type="button"
								onClick={() => setSelectedAdmin(admin)}
								className="flex w-full min-w-0 items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-left transition-colors hover:bg-zinc-800/70"
							>
								<div className="min-w-0 flex-1">
									<p
										title={displayName}
										className="truncate text-sm font-medium text-zinc-100"
									>
										{displayName}
									</p>
									<p
										title={admin.email}
										className="mt-1 truncate text-xs text-zinc-500"
									>
										{admin.email}
									</p>
								</div>

								<span className="shrink-0 text-xs uppercase tracking-[0.2em] text-zinc-500">
									Подробнее
								</span>
							</button>
						)
					})}
				</div>
			)}

			{selectedAdmin ? (
				<OrganizationAdminDetailsModal
					admin={selectedAdmin}
					onClose={() => setSelectedAdmin(null)}
				/>
			) : null}
		</section>
	)
}
