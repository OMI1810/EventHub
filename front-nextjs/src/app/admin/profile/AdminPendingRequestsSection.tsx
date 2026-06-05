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
	const shouldScroll = requests.length > 5

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
		<section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:rounded-3xl sm:p-6 lg:p-8">
			<div className="min-w-0">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					Заявки
				</p>
				<h2 className="mt-3 break-words text-2xl font-bold [overflow-wrap:anywhere]">
					Поданные заявки
				</h2>
			</div>

			<div className="mt-6">
				{requests.length ? (
					<div
						className={`grid gap-3 ${
							shouldScroll ? 'max-h-[30rem] overflow-y-auto pr-1' : ''
						}`}
					>
						{requests.map(request => (
							<div
								key={request.idJoinTeam}
								className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5"
							>
								<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<button
										type="button"
										onClick={() => onSelect(request)}
										className="min-w-0 text-left"
									>
										<p
											className="line-clamp-2 text-base font-semibold text-zinc-100 [overflow-wrap:anywhere]"
											title={request.organization.name}
										>
											{request.organization.name}
										</p>
										<p className="mt-2 break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
											Ожидает подтверждения владельцем организации.
										</p>
									</button>

									<button
										type="button"
										onClick={() => mutateCancelRequest(request.idJoinTeam)}
										disabled={isPending}
										className="flex w-full items-center justify-center rounded-xl border border-rose-700 px-4 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[150px]"
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
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-5 sm:px-5">
						<p className="break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
							Сейчас нет активных заявок на вступление в организации.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
