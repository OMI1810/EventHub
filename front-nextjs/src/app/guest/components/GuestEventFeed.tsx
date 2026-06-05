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
		<div className="mx-auto w-full max-w-7xl px-3 py-4 text-white sm:px-4 sm:py-8">
			<section className="max-w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-6">
				<div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Гостевой режим
						</p>
						<h1 className="mt-3 break-words text-3xl font-bold [overflow-wrap:anywhere]">
							Лента мероприятий
						</h1>
						<p className="mt-3 max-w-3xl break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
							Здесь можно посмотреть публичные мероприятия без входа в аккаунт.
						</p>
					</div>

					<div className="grid gap-3 sm:flex sm:flex-wrap">
						<Link
							href={PUBLIC_PAGES.LOGIN}
							className="rounded-xl border border-zinc-700 px-4 py-2.5 text-center text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
						>
							Войти
						</Link>
						<Link
							href={PUBLIC_PAGES.REGISTER}
							className="rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
						>
							Зарегистрироваться
						</Link>
					</div>
				</div>

				<div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{events.length ? (
						events.map(event => (
							<GuestEventCard
								key={event.idEvent}
								event={event}
							/>
						))
					) : (
						<div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-500 md:col-span-2 xl:col-span-3">
							Доступных мероприятий не найдено.
						</div>
					)}
				</div>
			</section>
		</div>
	)
}
