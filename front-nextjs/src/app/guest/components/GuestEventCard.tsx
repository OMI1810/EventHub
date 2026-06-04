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
		year: 'numeric'
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
			className="group cursor-pointer rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
		>
			<div>
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					{event.organization.name}
				</p>
				<h3 className="mt-3 text-2xl font-bold transition-colors group-hover:text-emerald-300">
					{event.title}
				</h3>
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
				<button
					type="button"
					onClick={currentEvent => {
						currentEvent.stopPropagation()
						router.push(PUBLIC_PAGES.LOGIN)
					}}
					className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
				>
					Войти, чтобы участвовать
				</button>
			</div>
		</article>
	)
}
