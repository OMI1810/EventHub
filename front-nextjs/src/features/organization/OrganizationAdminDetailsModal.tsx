'use client'

import organizationService from '@/services/organization.service'
import { IOrganizationAdminSummary } from '@/types/organization.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
	admin: IOrganizationAdminSummary
	onClose: () => void
}

interface AdminDetailPanelProps {
	id: string
	label: string
	value?: string | null
	isOpen: boolean
	onToggle: (id: string) => void
}

function AdminDetailPanel({
	id,
	label,
	value,
	isOpen,
	onToggle
}: AdminDetailPanelProps) {
	const displayValue = value?.trim() || 'Не указано'

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onToggle(id)}
			onKeyDown={event => {
				if (event.key !== 'Enter' && event.key !== ' ') return
				event.preventDefault()
				onToggle(id)
			}}
			className="flex h-32 w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-left transition-colors hover:bg-zinc-900"
		>
			<p className="break-words text-xs uppercase tracking-[0.2em] text-zinc-500">
				{label}
			</p>
			<p
				title={displayValue}
				className={`mt-2 min-h-0 max-w-full cursor-text select-text break-all text-sm text-zinc-100 [overflow-wrap:anywhere] ${
					isOpen ? 'overflow-y-auto pr-1' : 'line-clamp-3 overflow-hidden'
				}`}
				onClick={event => event.stopPropagation()}
				onMouseDown={event => event.stopPropagation()}
			>
				{displayValue}
			</p>
		</div>
	)
}

export function OrganizationAdminDetailsModal({ admin, onClose }: Props) {
	const queryClient = useQueryClient()
	const [openedPanelId, setOpenedPanelId] = useState<string | null>(null)

	const togglePanel = (id: string) => {
		setOpenedPanelId(current => (current === id ? null : id))
	}

	const { mutate: mutateRemoveAdmin, isPending } = useMutation({
		mutationKey: ['organization', 'admins', 'remove', admin.idUser],
		mutationFn: () =>
			organizationService.removeAdminFromMyOrganization(admin.idUser),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['organization', 'admins']
			})
			toast.success('Администратор удален из организации')
			onClose()
		},
		onError() {
			toast.error('Не удалось удалить администратора из организации')
		}
	})

	const panels = [
		{ id: 'surname', label: 'Фамилия', value: admin.surname },
		{ id: 'name', label: 'Имя', value: admin.name },
		{ id: 'patronymic', label: 'Отчество', value: admin.patronymic },
		{ id: 'email', label: 'Email', value: admin.email },
		{ id: 'phone', label: 'Телефон', value: admin.phone },
		{ id: 'contact', label: 'Дополнительный контакт', value: admin.contact }
	]

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="max-h-[90dvh] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex min-w-0 items-start justify-between gap-4">
					<div className="min-w-0 flex-1">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Администратор
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="shrink-0 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Закрыть
					</button>
				</div>

				<div className="mt-6 grid max-h-[56dvh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
					{panels.map(panel => (
						<div key={panel.id} className="min-w-0">
							<AdminDetailPanel
								{...panel}
								isOpen={openedPanelId === panel.id}
								onToggle={togglePanel}
							/>
						</div>
					))}
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
