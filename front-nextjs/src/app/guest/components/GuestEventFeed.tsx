'use client'

import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { IPublicEventFeedItem } from '@/types/public-event.types'
import Link from 'next/link'
import { GuestEventCard } from './GuestEventCard'

interface Props {
	events: IPublicEventFeedItem[]
}

export function GuestEventFeed({ events }: Props) {
	return (
		<div className="mx-auto max-w-7xl px-4 py-8 text-white">
			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="flex flex-col gap-2">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Гостевой режим
						</p>
						<h1 className="text-3xl font-bold">Лента мероприятий</h1>
						<p className="text-sm text-zinc-400">
							Здесь можно посмотреть публичные мероприятия без входа в аккаунт.
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<Link
							href={PUBLIC_PAGES.LOGIN}
							className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
						>
							Войти
						</Link>
						<Link
							href={PUBLIC_PAGES.REGISTER}
							className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
						>
							Зарегистрироваться
						</Link>
					</div>
				</div>

				<div className="mt-6 grid gap-4 xl:grid-cols-2">
					{events.length ? (
						events.map(event => <GuestEventCard key={event.idEvent} event={event} />)
					) : (
						<div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-500 xl:col-span-2">
							Доступных мероприятий не найдено.
						</div>
					)}
				</div>
			</section>
		</div>
	)
}
