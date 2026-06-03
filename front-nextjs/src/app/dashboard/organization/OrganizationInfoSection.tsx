'use client'

import { IOrganizationSummary } from '@/types/organization.types'
import { useState } from 'react'
import { OrganizationDeleteModal } from './OrganizationDeleteModal'
import { OrganizationEditForm } from './OrganizationEditForm'

interface OrganizationInfoSectionProps {
	organization: IOrganizationSummary
}

export function OrganizationInfoSection({
	organization
}: OrganizationInfoSectionProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	return (
		<>
			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Инфо об организации
						</p>
						<h1 className="mt-3 text-3xl font-bold">{organization.name}</h1>
						<p className="mt-4 max-w-3xl text-sm text-zinc-300">
							{organization.description ||
								'Описание организации пока не добавлено.'}
						</p>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row">
						<button
							type="button"
							onClick={() => setIsDeleteModalOpen(true)}
							className="rounded-xl border border-rose-900/70 bg-rose-950/40 px-5 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-900/50"
						>
							Удалить
						</button>

						<button
							type="button"
							onClick={() => setIsEditing(current => !current)}
							className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-800"
						>
							{isEditing ? 'Закрыть редактирование' : 'Редактировать'}
						</button>
					</div>
				</div>

				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Email
						</p>
						<p className="mt-2 text-sm text-zinc-100">
							{organization.owner.email}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Телефон
						</p>
						<p className="mt-2 text-sm text-zinc-100">
							{organization.owner.phone || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Дополнительный контакт
						</p>
						<p className="mt-2 text-sm text-zinc-100">
							{organization.owner.contact || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Адрес
						</p>
						<p className="mt-2 text-sm text-zinc-100">
							{organization.address || 'Не указано'}
						</p>
					</div>
				</div>

				{isEditing ? (
					<OrganizationEditForm
						organization={organization}
						onCancel={() => setIsEditing(false)}
					/>
				) : null}
			</section>

			{isDeleteModalOpen ? (
				<OrganizationDeleteModal
					onClose={() => setIsDeleteModalOpen(false)}
				/>
			) : null}
		</>
	)
}
