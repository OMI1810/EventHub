'use client'

import { IUserEventFeedItem } from '@/types/user-event.types'
import { UserEventCard } from './UserEventCard'

interface Props {
	events: IUserEventFeedItem[]
}

export function UserEventFeed({ events }: Props) {
	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
			<div className="flex flex-col gap-2">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					Главная
				</p>
				<h1 className="text-3xl font-bold">Лента мероприятий</h1>
				<p className="text-sm text-zinc-400">
					Здесь отображаются мероприятия, доступные для регистрации.
				</p>
			</div>

			<div className="mt-6 grid gap-4 xl:grid-cols-2">
				{events.length ? (
					events.map(event => <UserEventCard key={event.idEvent} event={event} />)
				) : (
					<div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-500 xl:col-span-2">
						Доступных мероприятий не найдено.
					</div>
				)}
			</div>
		</section>
	)
}
