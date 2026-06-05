'use client'

import { GUEST_PAGES } from '@/config/pages/guest.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { IPublicEventFeedItem } from '@/types/public-event.types'
import { useRouter } from 'next/navigation'

interface Props {
	event: IPublicEventFeedItem
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

export function GuestEventCard({ event }: Props) {
	const router = useRouter()
	const eventHref = GUEST_PAGES.event(event.slug || event.idEvent)

	return (
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
			className="group flex min-h-[19rem] min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:p-5"
		>
			<div className="min-w-0">
				<p
					title={event.organization.name}
					className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500"
				>
					{event.organization.name}
				</p>
				<h3
					title={event.title}
					className="mt-3 line-clamp-2 break-words text-xl font-bold text-zinc-100 transition-colors [overflow-wrap:anywhere] group-hover:text-emerald-300 sm:text-2xl"
				>
					{event.title}
				</h3>
			</div>

			<p
				title={event.description || undefined}
				className="mt-4 line-clamp-3 break-words text-sm leading-6 text-zinc-400 [overflow-wrap:anywhere]"
			>
				{event.description || 'Описание мероприятия отсутствует.'}
			</p>

			<div className="mt-5 flex min-w-0 flex-wrap gap-2 text-xs text-zinc-400">
				<span className="max-w-full truncate rounded-full border border-zinc-800 px-3 py-1">
					{event.type}
				</span>
				<span className="max-w-full truncate rounded-full border border-zinc-800 px-3 py-1">
					{event.format}
				</span>
				<span className="max-w-full truncate rounded-full border border-zinc-800 px-3 py-1">
					{formatEventDates(event.dataStart, event.dataEnd)}
				</span>
			</div>

			<div className="mt-auto pt-6">
				<button
					type="button"
					onClick={currentEvent => {
						currentEvent.stopPropagation()
						router.push(PUBLIC_PAGES.LOGIN)
					}}
					className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
				>
					Войти, чтобы участвовать
				</button>
			</div>
		</article>
	)
}
