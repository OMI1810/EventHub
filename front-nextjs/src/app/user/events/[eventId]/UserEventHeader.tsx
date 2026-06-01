'use client'

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

export function UserEventHeader({ event }: Props) {
	const queryClient = useQueryClient()
	const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false)

	const { mutate: mutateParticipate, isPending } = useMutation({
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
						<button
							type="button"
							onClick={() => mutateParticipate()}
							disabled={
								event.isParticipating || !event.canParticipate || isPending
							}
							className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{event.isParticipating
								? 'Вы участвуете'
								: isPending
									? 'Регистрация...'
									: 'Участвовать'}
						</button>
					</div>
				</div>
			</section>

			{isOrganizationModalOpen ? (
				<UserOrganizationContactsModal
					organization={event.organization}
					onClose={() => setIsOrganizationModalOpen(false)}
				/>
			) : null}
		</>
	)
}
