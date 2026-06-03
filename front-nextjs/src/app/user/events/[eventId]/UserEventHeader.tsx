'use client'

import { UserLeaveEventModal } from '@/app/user/components/UserLeaveEventModal'
import { getParticipationBlockedReason } from '@/app/user/utils/userEventParticipation'
import { EventHeaderBase } from '@/components/events/EventHeaderBase'
import userEventService from '@/services/user-event.service'
import { IUserEventDetails } from '@/types/user-event.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { UserOrganizationContactsModal } from './UserOrganizationContactsModal'

interface Props {
	event: IUserEventDetails
}

function getLeaveWarning(event: IUserEventDetails) {
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
	const blockedReason = getParticipationBlockedReason(event)

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
			<EventHeaderBase
				organizationName={event.organization.name}
				title={event.title}
				description={event.description}
				type={event.type}
				format={event.format}
				dataStart={event.dataStart}
				dataEnd={event.dataEnd}
				onOpenOrganization={() => setIsOrganizationModalOpen(true)}
				actions={
					event.isParticipating ? (
						<button
							type="button"
							onClick={() => setIsLeaveModalOpen(true)}
							disabled={isLeavePending}
							className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isLeavePending ? 'Выходим...' : 'Покинуть мероприятие'}
						</button>
					) : (
						<div className="grid justify-items-start gap-2">
							<button
								type="button"
								onClick={() => mutateParticipate()}
								disabled={!event.canParticipate || isParticipatingPending}
								className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isParticipatingPending ? 'Регистрация...' : 'Участвовать'}
							</button>
							{!event.canParticipate && blockedReason ? (
								<p className="max-w-sm text-xs leading-5 text-zinc-500">
									{blockedReason}
								</p>
							) : null}
						</div>
					)
				}
			/>

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
