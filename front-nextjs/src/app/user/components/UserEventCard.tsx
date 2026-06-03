'use client'

import { USER_PAGES } from '@/config/pages/user.config'
import userEventService from '@/services/user-event.service'
import { IUserEventFeedItem } from '@/types/user-event.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getParticipationBlockedReason } from '../utils/userEventParticipation'
import { UserLeaveEventModal } from './UserLeaveEventModal'

interface Props {
	event: IUserEventFeedItem
}

function formatEventDates(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(
		new Date(end)
	)}`
}

export function UserEventCard({ event }: Props) {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
	const blockedReason = getParticipationBlockedReason(event)

	const { mutate: mutateParticipate, isPending: isParticipatingPending } = useMutation({
		mutationKey: ['user-events', 'participate', event.idEvent],
		mutationFn: () => userEventService.participate(event.idEvent),
		onSuccess() {
			toast.success('Вы зарегистрировались на мероприятие')
			queryClient.invalidateQueries({ queryKey: ['user-events', 'feed'] })
			queryClient.invalidateQueries({ queryKey: ['user-events', 'my'] })
		},
		onError(error: any) {
			const message =
				error?.response?.data?.message ??
				'Не удалось зарегистрироваться на мероприятие'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const { mutate: mutateLeave, isPending: isLeavingPending } = useMutation({
		mutationKey: ['user-events', 'leave', event.idEvent],
		mutationFn: () => userEventService.leave(event.idEvent),
		onSuccess() {
			setIsLeaveModalOpen(false)
			toast.success('Вы покинули мероприятие')
			queryClient.invalidateQueries({ queryKey: ['user-events', 'feed'] })
			queryClient.invalidateQueries({ queryKey: ['user-events', 'my'] })
		},
		onError(error: any) {
			const message =
				error?.response?.data?.message ?? 'Не удалось покинуть мероприятие'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	return (
		<>
			<article
				role="link"
				tabIndex={0}
				onClick={() => router.push(USER_PAGES.event(event.idEvent))}
				onKeyDown={currentEvent => {
					if (currentEvent.key === 'Enter' || currentEvent.key === ' ') {
						currentEvent.preventDefault()
						router.push(USER_PAGES.event(event.idEvent))
					}
				}}
				className="group cursor-pointer rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
			>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							{event.organization.name}
						</p>
						<h3 className="mt-3 text-2xl font-bold transition-colors group-hover:text-emerald-300">
							{event.title}
						</h3>
					</div>

					{event.isParticipating ? (
						<span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
							Вы уже участвуете
						</span>
					) : null}
				</div>

				<p className="mt-4 text-sm leading-6 text-zinc-400">
					{event.description || 'Описание мероприятия отсутствует.'}
				</p>

				<div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400">
					<span className="rounded-full border border-zinc-800 px-3 py-1">
						{event.type}
					</span>
					<span className="rounded-full border border-zinc-800 px-3 py-1">
						{event.format}
					</span>
					<span className="rounded-full border border-zinc-800 px-3 py-1">
						{formatEventDates(event.dataStart, event.dataEnd)}
					</span>
				</div>

				<div className="mt-6 flex flex-wrap items-center gap-3">
					{event.isParticipating ? (
						<button
							type="button"
							onClick={currentEvent => {
								currentEvent.stopPropagation()
								setIsLeaveModalOpen(true)
							}}
							disabled={isLeavingPending}
							className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isLeavingPending ? 'Выходим...' : 'Покинуть мероприятие'}
						</button>
					) : (
						<div className="grid justify-items-start gap-2">
							<button
								type="button"
								onClick={currentEvent => {
									currentEvent.stopPropagation()
									mutateParticipate()
								}}
								disabled={!event.canParticipate || isParticipatingPending}
								className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isParticipatingPending ? 'Регистрация...' : 'Участвовать'}
							</button>

							{!event.canParticipate && blockedReason ? (
								<p className="max-w-md text-xs leading-5 text-zinc-500">
									{blockedReason}
								</p>
							) : null}
						</div>
					)}
				</div>
			</article>

			{isLeaveModalOpen ? (
				<UserLeaveEventModal
					title="Покинуть мероприятие?"
					description="Вы уверены, что хотите покинуть мероприятие? Ваше участие будет удалено. Если вы состоите в команде, вы также выйдете из неё. Если вы капитан команды, команда будет удалена."
					isPending={isLeavingPending}
					onClose={() => setIsLeaveModalOpen(false)}
					onConfirm={() => mutateLeave()}
				/>
			) : null}
		</>
	)
}
