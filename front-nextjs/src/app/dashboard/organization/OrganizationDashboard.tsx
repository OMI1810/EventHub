'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useOrganization } from '@/hooks/useOrganization'
import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'
import { OrganizationAdminsSection } from './OrganizationAdminsSection'
import { OrganizationDeleteModal } from './OrganizationDeleteModal'
import { OrganizationEditForm } from './OrganizationEditForm'
import { OrganizationInviteSection } from './OrganizationInviteSection'
import { OrganizationJoinRequestsSection } from './OrganizationJoinRequestsSection'

export function OrganizationDashboard() {
	const router = useRouter()
	const { organization, isLoading } = useOrganization()
	const [isPending, startTransition] = useTransition()
	const [isEditing, setIsEditing] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation({
		mutationKey: ['logout'],
		mutationFn: () => authService.logout(),
		onSuccess() {
			startTransition(() => {
				router.push(PUBLIC_PAGES.LOGIN)
			})
		}
	})

	const isLogoutLoading = isPending || isLogoutPending

	if (isLoading) {
		return (
			<div className="mt-10">
				<MiniLoader
					width={150}
					height={150}
				/>
			</div>
		)
	}

	if (!organization) {
		return (
			<div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
				<h1 className="text-2xl font-bold">Панель организации</h1>
				<p className="mt-4 text-sm text-zinc-400">
					Данные организации недоступны для текущего аккаунта.
				</p>
			</div>
		)
	}

	return (
		<div className="w-full max-w-3xl space-y-6 text-white">
			<div className="flex justify-end">
				<button
					onClick={() => mutateLogout()}
					disabled={isLogoutLoading}
					className={twMerge(
						'rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-800',
						isLogoutLoading && 'cursor-not-allowed opacity-60'
					)}
				>
					{isLogoutLoading ? 'Загрузка...' : 'Выйти'}
				</button>
			</div>

			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Организация
						</p>
						<h1 className="mt-3 text-3xl font-bold">{organization.name}</h1>
						<p className="mt-4 text-sm text-zinc-300">
							{organization.description || 'Описание организации пока не добавлено.'}
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

			<OrganizationAdminsSection />
			<OrganizationInviteSection />
			<OrganizationJoinRequestsSection />

			{isDeleteModalOpen ? (
				<OrganizationDeleteModal
					onClose={() => setIsDeleteModalOpen(false)}
				/>
			) : null}
		</div>
	)
}
