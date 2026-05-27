'use client'

import organizationService from '@/services/organization.service'
import { IOrganizationAdminSummary } from '@/types/organization.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getOrganizationAdminDisplayName } from './organization.helpers'

interface Props {
	admin: IOrganizationAdminSummary
	onClose: () => void
}

export function OrganizationAdminDetailsModal({ admin, onClose }: Props) {
	const queryClient = useQueryClient()

	const { mutate: mutateRemoveAdmin, isPending } = useMutation({
		mutationKey: ['organization', 'admins', 'remove', admin.idUser],
		mutationFn: () =>
			organizationService.removeAdminFromMyOrganization(admin.idUser),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['organization', 'admins']
			})
			toast.success('Администратор удалён из организации')
			onClose()
		},
		onError() {
			toast.error('Не удалось удалить администратора из организации')
		}
	})

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Администратор
						</p>
						<h3 className="mt-3 text-2xl font-bold">
							{getOrganizationAdminDisplayName(admin)}
						</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
					>
						Закрыть
					</button>
				</div>

				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Email
						</p>
						<p className="mt-2 text-sm text-zinc-100">{admin.email}</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Телефон
						</p>
						<p className="mt-2 text-sm text-zinc-100">
							{admin.phone || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:col-span-2">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Дополнительный контакт
						</p>
						<p className="mt-2 text-sm text-zinc-100">
							{admin.contact || 'Не указано'}
						</p>
					</div>
				</div>

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={() => mutateRemoveAdmin()}
						disabled={isPending}
						className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isPending ? 'Удаление...' : 'Удалить администратора'}
					</button>
				</div>
			</div>
		</div>
	)
}
