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
		year: 'numeric',
		timeZone: 'Europe/Moscow'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(
		new Date(end)
	)}`
}

function formatDateTime(date: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Europe/Moscow'
	}).format(new Date(date))
}

function getParticipationUnavailableText(event: IUserEventFeedItem) {
	if (!event.timeState.isRegistrationStarted && event.dataStartRegistration) {
		return `Регистрация начнётся ${formatDateTime(event.dataStartRegistration)}`
	}

	if (event.timeState.isRegistrationFinished) {
		return 'Регистрация завершена'
	}

	if (event.timeState.isEventStarted) {
		return 'Мероприятие уже началось'
	}

	return 'Участие сейчас недоступно'
}

export function UserEventCard({ event }: Props) {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
	const blockedReason = getParticipationBlockedReason(event)
	const eventHref = USER_PAGES.event(event.slug || event.idEvent)
	const visibleTags = event.tags?.slice(0, 3) ?? []
	const hiddenTagsCount = Math.max(
		(event.tags?.length ?? 0) - visibleTags.length,
		0
	)

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
				onClick={() => router.push(eventHref)}
				onKeyDown={currentEvent => {
					if (currentEvent.key === 'Enter' || currentEvent.key === ' ') {
						currentEvent.preventDefault()
						router.push(eventHref)
					}
				}}
				className="group flex min-h-[320px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
			>
				<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500">
							{event.organization.name}
						</p>
						<h3 className="mt-3 line-clamp-2 break-words text-2xl font-bold transition-colors group-hover:text-emerald-300">
							{event.title}
						</h3>
					</div>

					{event.isParticipating ? (
						<span className="w-fit shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 sm:max-w-[180px] sm:truncate">
							Вы уже участвуете
						</span>
					) : null}
				</div>

				<p className="mt-4 line-clamp-3 min-h-[72px] break-words text-sm leading-6 text-zinc-400">
					{event.description || 'Описание мероприятия отсутствует.'}
				</p>

				<div className="mt-4 flex min-h-[32px] flex-wrap gap-2 overflow-hidden text-xs text-emerald-200">
					{visibleTags.map(tag => (
						<span
							key={tag.idTag || tag.name}
							className="max-w-[140px] truncate rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1"
						>
							{tag.name}
						</span>
					))}
					{hiddenTagsCount > 0 ? (
						<span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
							+{hiddenTagsCount}
						</span>
					) : null}
				</div>

				<div className="mt-4 flex flex-wrap gap-2 overflow-hidden text-xs text-zinc-400">
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

				<div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
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
