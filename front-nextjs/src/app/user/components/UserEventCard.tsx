'use client'

import { USER_PAGES } from '@/config/pages/user.config'
import userEventService from '@/services/user-event.service'
import { IUserEventFeedItem } from '@/types/user-event.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
	const queryClient = useQueryClient()

	const { mutate: mutateParticipate, isPending } = useMutation({
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

	return (
		<article className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						{event.organization.name}
					</p>
					<Link
						href={USER_PAGES.event(event.idEvent)}
						className="mt-3 inline-block text-2xl font-bold transition-colors hover:text-emerald-300"
					>
						{event.title}
					</Link>
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
				<Link
					href={USER_PAGES.event(event.idEvent)}
					className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
				>
					Открыть
				</Link>

				<button
					type="button"
					onClick={() => mutateParticipate()}
					disabled={event.isParticipating || !event.canParticipate || isPending}
					className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{event.isParticipating
						? 'Вы участвуете'
						: isPending
							? 'Регистрация...'
							: 'Участвовать'}
				</button>
			</div>
		</article>
	)
}
