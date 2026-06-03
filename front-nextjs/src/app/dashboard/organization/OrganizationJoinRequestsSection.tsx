'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { useOrganizationJoinRequests } from '@/hooks/useOrganizationJoinRequests'
import organizationService from '@/services/organization.service'
import { IOrganizationJoinRequestSummary } from '@/types/organization.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getOrganizationJoinRequestDisplayName } from './organization.helpers'

interface RequestRowProps {
	joinRequest: IOrganizationJoinRequestSummary
}

function RequestRow({ joinRequest }: RequestRowProps) {
	const queryClient = useQueryClient()

	const invalidateQueries = async () => {
		await queryClient.invalidateQueries({
			queryKey: ['organization', 'join-requests']
		})
		await queryClient.invalidateQueries({
			queryKey: ['organization', 'admins']
		})
	}

	const { mutate: mutateApprove, isPending: isApprovePending } = useMutation({
		mutationKey: ['organization', 'join-requests', 'approve', joinRequest.idJoinTeam],
		mutationFn: () =>
			organizationService.approveMyOrganizationJoinRequest(joinRequest.idJoinTeam),
		onSuccess: async () => {
			await invalidateQueries()
			toast.success('Заявка одобрена')
		},
		onError() {
			toast.error('Не удалось одобрить заявку')
		}
	})

	const { mutate: mutateReject, isPending: isRejectPending } = useMutation({
		mutationKey: ['organization', 'join-requests', 'reject', joinRequest.idJoinTeam],
		mutationFn: () =>
			organizationService.rejectMyOrganizationJoinRequest(joinRequest.idJoinTeam),
		onSuccess: async () => {
			await invalidateQueries()
			toast.success('Заявка отклонена')
		},
		onError() {
			toast.error('Не удалось отклонить заявку')
		}
	})

	const isPending = isApprovePending || isRejectPending

	return (
		<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-sm font-medium text-zinc-100">
						{getOrganizationJoinRequestDisplayName(joinRequest)}
					</p>
					<p className="mt-1 text-xs text-zinc-500">{joinRequest.user.email}</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<button
						type="button"
						onClick={() => mutateApprove()}
						disabled={isPending}
						className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Принять
					</button>

					<button
						type="button"
						onClick={() => mutateReject()}
						disabled={isPending}
						className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Отклонить
					</button>
				</div>
			</div>
		</div>
	)
}

export function OrganizationJoinRequestsSection() {
	const { joinRequests, isLoading } = useOrganizationJoinRequests()

	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
				Заявки
			</p>
			<h2 className="mt-3 text-2xl font-bold">
				Заявки на вступление администраторов
			</h2>

			{isLoading ? (
				<div className="mt-6">
					<MiniLoader width={80} height={80} />
				</div>
			) : joinRequests.length === 0 ? (
				<p className="mt-6 text-sm text-zinc-400">
					Сейчас нет ожидающих заявок на вступление.
				</p>
			) : (
				<div className="mt-6 space-y-3">
					{joinRequests.map(joinRequest => (
						<RequestRow
							key={joinRequest.idJoinTeam}
							joinRequest={joinRequest}
						/>
					))}
				</div>
			)}
		</section>
	)
}
