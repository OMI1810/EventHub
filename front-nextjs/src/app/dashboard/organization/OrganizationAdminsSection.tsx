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
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
				Администраторы
			</p>
			<h2 className="mt-3 text-2xl font-bold">Список администраторов</h2>

			{isLoading ? (
				<div className="mt-6">
					<MiniLoader
						width={80}
						height={80}
					/>
				</div>
			) : admins.length === 0 ? (
				<p className="mt-6 text-sm text-zinc-400">
					В этой организации пока нет администраторов.
				</p>
			) : (
				<div className="mt-6 space-y-3">
					{admins.map(admin => (
						<button
							key={admin.idUser}
							type="button"
							onClick={() => setSelectedAdmin(admin)}
							className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-left transition-colors hover:bg-zinc-800/70"
						>
							<div>
								<p className="text-sm font-medium text-zinc-100">
									{getOrganizationAdminDisplayName(admin)}
								</p>
								<p className="mt-1 text-xs text-zinc-500">{admin.email}</p>
							</div>

							<span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Подробнее
							</span>
						</button>
					))}
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
