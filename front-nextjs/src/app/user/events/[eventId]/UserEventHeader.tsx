'use client'

import { UserLeaveEventModal } from '@/app/user/components/UserLeaveEventModal'
import userEventService from '@/services/user-event.service'
import { IUserEventDetails } from '@/types/user-event.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { UserOrganizationContactsModal } from './UserOrganizationContactsModal'

interface Props {
	event: IUserEventDetails
}

function formatDateRange(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
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
		minute: '2-digit'
	}).format(new Date(date))
}

function getParticipationUnavailableText(event: IUserEventDetails) {
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

function getLeaveWarning(event: IUserEventDetails) {
	if (event.hasTeams && event.teamContext?.selectedCaseId) {
		return 'Команда уже выбрала кейс, поэтому покинуть мероприятие нельзя.'
	}

	if (!event.hasTeams || !event.teamContext?.hasTeam) {
		return 'Вы уверены, что хотите покинуть мероприятие? Ваше участие будет удалено.'
	}

	if (event.teamContext.isCaptain) {
		return 'Вы капитан команды. Если покинете мероприятие, ваше участие будет удалено вместе с командой. Приглашения, заявки и командное решение тоже будут удалены, а участники команды останутся в мероприятии, но потеряют команду и выбранный кейс.'
	}

	return 'Вы уверены, что хотите покинуть мероприятие? Ваше участие будет удалено, и вы автоматически выйдете из команды.'
}

export function UserEventHeader({ event }: Props) {
	const queryClient = useQueryClient()
	const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false)
	const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
	const cannotLeaveSelectedCaseTeam = Boolean(
		event.hasTeams && event.teamContext?.selectedCaseId
	)

	const { mutate: mutateParticipate, isPending: isParticipatingPending } = useMutation({
		mutationKey: ['user-events', 'participate', event.idEvent],
		mutationFn: () => userEventService.participate(event.idEvent),
		onSuccess() {
			toast.success('Вы зарегистрировались на мероприятие')
			queryClient.invalidateQueries({ queryKey: ['user-events', 'feed'] })
			queryClient.invalidateQueries({ queryKey: ['user-events', 'my'] })
			queryClient.invalidateQueries({
				queryKey: ['user-events', 'details', event.idEvent]
			})
		},
		onError(error: any) {
			const message =
				error?.response?.data?.message ??
				'Не удалось зарегистрироваться на мероприятие'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const { mutate: mutateLeave, isPending: isLeavePending } = useMutation({
		mutationKey: ['user-events', 'leave', event.idEvent],
		mutationFn: () => userEventService.leave(event.idEvent),
		onSuccess() {
			setIsLeaveModalOpen(false)
			toast.success('Вы покинули мероприятие')
			queryClient.invalidateQueries({ queryKey: ['user-events', 'feed'] })
			queryClient.invalidateQueries({ queryKey: ['user-events', 'my'] })
			queryClient.invalidateQueries({
				queryKey: ['user-events', 'details', event.idEvent]
			})
			queryClient.invalidateQueries({ queryKey: ['user-team', event.idEvent] })
		},
		onError(error: any) {
			const message =
				error?.response?.data?.message ?? 'Не удалось покинуть мероприятие'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	return (
		<>
			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0">
						<button
							type="button"
							onClick={() => setIsOrganizationModalOpen(true)}
							className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-300"
						>
							{event.organization.name}
						</button>

						<h1 className="mt-3 text-3xl font-bold">{event.title}</h1>
						<p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
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
								{formatDateRange(event.dataStart, event.dataEnd)}
							</span>
						</div>
					</div>

					<div className="flex shrink-0">
						{event.isParticipating ? (
							<button
								type="button"
								onClick={() => {
									if (cannotLeaveSelectedCaseTeam) return
									setIsLeaveModalOpen(true)
								}}
								disabled={isLeavePending || cannotLeaveSelectedCaseTeam}
								className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
								title={
									cannotLeaveSelectedCaseTeam
										? 'Команда уже выбрала кейс, покинуть мероприятие нельзя'
										: undefined
								}
							>
								{isLeavePending ? 'Выходим...' : 'Покинуть мероприятие'}
							</button>
						) : event.canParticipate ? (
							<button
								type="button"
								onClick={() => mutateParticipate()}
								disabled={isParticipatingPending}
								className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isParticipatingPending ? 'Регистрация...' : 'Участвовать'}
							</button>
						) : (
							<div className="max-w-64 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm leading-5 text-zinc-300">
								{getParticipationUnavailableText(event)}
							</div>
						)}
					</div>
				</div>
			</section>

			{isOrganizationModalOpen ? (
				<UserOrganizationContactsModal
					organization={event.organization}
					onClose={() => setIsOrganizationModalOpen(false)}
				/>
			) : null}

			{isLeaveModalOpen ? (
				<UserLeaveEventModal
					title="Покинуть мероприятие?"
					description={getLeaveWarning(event)}
					isPending={isLeavePending}
					onClose={() => setIsLeaveModalOpen(false)}
					onConfirm={() => mutateLeave()}
				/>
			) : null}
		</>
	)
}
