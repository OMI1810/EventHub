'use client'

import { JoinByCodeModal } from '@/app/invites/components/JoinByCodeModal'
import { MiniLoader } from '@/components/ui/MiniLoader'
import { USER_PAGES } from '@/config/pages/user.config'
import userRequestService from '@/services/user-request.service'
import {
	IUserRequestItem,
	UserRequestStatus,
	UserRequestType
} from '@/types/user-request.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { twMerge } from 'tailwind-merge'

type RequestFilter = 'all' | UserRequestType

const FILTERS: Array<{ value: RequestFilter; label: string }> = [
	{ value: 'all', label: 'Все' },
	{ value: 'event', label: 'Мероприятия' },
	{ value: 'team', label: 'Команды' }
]

const STATUS_LABELS: Record<UserRequestStatus, string> = {
	PENDING: 'Ожидает подтверждения',
	ACCEPT: 'Принята',
	REJECTED: 'Отклонена',
	CANCELED: 'Отменена'
}

const STATUS_STYLES: Record<UserRequestStatus, string> = {
	PENDING: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
	ACCEPT: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
	REJECTED: 'border-red-500/40 bg-red-500/10 text-red-200',
	CANCELED: 'border-zinc-700 bg-zinc-800 text-zinc-300'
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		dateStyle: 'medium',
		timeZone: 'Europe/Moscow'
	}).format(new Date(value))
}

function RequestCard({ request }: { request: IUserRequestItem }) {
	const queryClient = useQueryClient()

	const cancelMutation = useMutation({
		mutationFn: () =>
			request.type === 'team'
				? userRequestService.cancelTeamRequest(request.id)
				: userRequestService.cancelEventRequest(request.id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['user-requests'] })
			toast.success('Заявка отозвана')
		},
		onError: () => toast.error('Не удалось отозвать заявку')
	})

	return (
		<article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
							{request.type === 'team' ? 'Команда' : 'Приватное мероприятие'}
						</span>
						<span
							className={twMerge(
								'rounded-full border px-3 py-1 text-xs font-medium',
								STATUS_STYLES[request.status]
							)}
						>
							{STATUS_LABELS[request.status]}
						</span>
					</div>

					<h2 className="mt-4 text-2xl font-bold text-white">
						{request.type === 'team' ? request.team?.name : request.event.title}
					</h2>

					<div className="mt-3 space-y-1 text-sm text-zinc-400">
						{request.type === 'team' ? (
							<p>Мероприятие: {request.event.title}</p>
						) : (
							<p>Организация: {request.event.organizationName}</p>
						)}
						<p>
							{request.event.type} · {request.event.format} ·{' '}
							{formatDate(request.event.dataStart)} -{' '}
							{formatDate(request.event.dataEnd)}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap gap-3">
					{request.status === 'ACCEPT' ? (
						<Link
							href={USER_PAGES.event(request.event.slug || request.event.idEvent)}
							className="rounded-2xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
						>
							Перейти
						</Link>
					) : null}

					{request.status === 'PENDING' ? (
						<button
							type="button"
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending}
							className="rounded-2xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{cancelMutation.isPending ? 'Отзываем...' : 'Отозвать заявку'}
						</button>
					) : null}
				</div>
			</div>
		</article>
	)
}

export function UserRequestsPage() {
	const queryClient = useQueryClient()
	const [filter, setFilter] = useState<RequestFilter>('all')
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

	const { data, isLoading } = useQuery({
		queryKey: ['user-requests'],
		queryFn: () => userRequestService.getMyRequests()
	})

	const submitCodeMutation = useMutation({
		mutationFn: (code: string) => userRequestService.submitByCode(code),
		onSuccess: async response => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['user-requests'] }),
				queryClient.invalidateQueries({ queryKey: ['user-events', 'my'] })
			])
			setIsJoinModalOpen(false)
			toast.success(
				response.data.type === 'team'
					? 'Заявка в команду отправлена'
					: 'Заявка в мероприятие отправлена'
			)
		},
		onError: () => toast.error('Не удалось отправить заявку')
	})

	const requests = data?.data ?? []
	const filteredRequests = useMemo(
		() =>
			filter === 'all'
				? requests
				: requests.filter(request => request.type === filter),
		[filter, requests]
	)

	return (
		<div className="space-y-6">
			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
				<p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
					Мои заявки
				</p>
				<div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 className="text-4xl font-bold text-white">
							Заявки и приглашения
						</h1>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
							Сюда можно ввести или отсканировать код команды или приватного
							мероприятия. После отправки заявка появится в списке ниже.
						</p>
					</div>

					<button
						type="button"
						onClick={() => setIsJoinModalOpen(true)}
						className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
					>
						Ввести код
					</button>
				</div>
			</section>

			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
				<div className="flex flex-wrap gap-3">
					{FILTERS.map(item => (
						<button
							key={item.value}
							type="button"
							onClick={() => setFilter(item.value)}
							className={twMerge(
								'rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors',
								filter === item.value
									? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
									: 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
							)}
						>
							{item.label}
						</button>
					))}
				</div>

				<div className="mt-5 space-y-4">
					{isLoading ? (
						<div className="flex justify-center py-10">
							<MiniLoader width={90} height={90} />
						</div>
					) : filteredRequests.length ? (
						filteredRequests.map(request => (
							<RequestCard key={`${request.type}-${request.id}`} request={request} />
						))
					) : (
						<div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-500">
							Заявок пока нет. Введите код команды или приватного мероприятия,
							чтобы отправить первую заявку.
						</div>
					)}
				</div>
			</section>

			{isJoinModalOpen ? (
				<JoinByCodeModal
					label="Приглашение"
					title="Вступить по коду"
					description="Введите код команды или приватного мероприятия вручную либо отсканируйте QR-код."
					codeLabel="Код приглашения"
					codePlaceholder="НАПРИМЕР, A1B2-C3D4"
					emptyHint="Код может относиться к команде или приватному мероприятию."
					filledHint="Проверьте код и отправьте заявку."
					scanButtonLabel="Сканировать QR"
					scannerTitle="Сканирование QR-кода"
					submitLabel="Отправить заявку"
					isPending={submitCodeMutation.isPending}
					onClose={() => setIsJoinModalOpen(false)}
					onSubmit={code => submitCodeMutation.mutate(code)}
					onDetected={code => submitCodeMutation.mutate(code)}
				/>
			) : null}
		</div>
	)
}
