'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import adminOrganizationService from '@/services/admin-organization.service'
import { IAdminOrganizationRequestSummary } from '@/types/admin-organization.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

interface Props {
	requests: IAdminOrganizationRequestSummary[]
	onSelect: (request: IAdminOrganizationRequestSummary) => void
}

export function AdminPendingRequestsSection({ requests, onSelect }: Props) {
	const queryClient = useQueryClient()

	const { mutate: mutateCancelRequest, isPending } = useMutation({
		mutationKey: ['admin', 'organization-requests', 'cancel'],
		mutationFn: (requestId: string) =>
			adminOrganizationService.cancelOrganizationRequest(requestId),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['admin', 'organization-requests']
			})
			toast.success('Заявка отменена')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message =
				error?.response?.data?.message ?? 'Не удалось отменить заявку'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div>
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					Заявки
				</p>
				<h2 className="mt-3 text-2xl font-bold">Поданные заявки</h2>
			</div>

			<div className="mt-6">
				{requests.length ? (
					<div className="grid gap-3">
						{requests.map(request => (
							<div
								key={request.idJoinTeam}
								className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4"
							>
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<button
										type="button"
										onClick={() => onSelect(request)}
										className="text-left"
									>
										<p className="text-base font-semibold text-zinc-100">
											{request.organization.name}
										</p>
										<p className="mt-2 text-sm text-zinc-400">
											Ожидает подтверждения владельцем организации.
										</p>
									</button>

									<button
										type="button"
										onClick={() => mutateCancelRequest(request.idJoinTeam)}
										disabled={isPending}
										className="flex min-w-[150px] items-center justify-center rounded-xl border border-rose-700 px-4 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{isPending ? (
											<MiniLoader width={18} height={18} />
										) : (
											'Отменить заявку'
										)}
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-5">
						<p className="text-sm text-zinc-400">
							Сейчас нет активных заявок на вступление в организации.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
