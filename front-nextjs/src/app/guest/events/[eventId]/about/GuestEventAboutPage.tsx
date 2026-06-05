'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { GUEST_PAGES } from '@/config/pages/guest.config'
import publicEventService from '@/services/public-event.service'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const ArcGisPointMap = dynamic(
	() =>
		import('@/components/map/ArcGisPointMap').then(
			module => module.ArcGisPointMap
		),
	{
		ssr: false,
		loading: () => (
			<div className="h-80 rounded-md border border-zinc-700 bg-zinc-950 sm:h-[460px]" />
		)
	}
)

interface Props {
	eventId: string
}

function formatDateRange(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Europe/Moscow'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(
		new Date(end)
	)}`
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5">
			<p className="break-words text-[10px] uppercase tracking-[0.16em] text-zinc-500 [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.2em]">
				{label}
			</p>
			<p className="mt-3 break-words text-sm text-zinc-200 [overflow-wrap:anywhere]">
				{value || 'Не указано'}
			</p>
		</div>
	)
}

export function GuestEventAboutPage({ eventId }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['public-events', 'details', eventId],
		queryFn: () => publicEventService.getEventDetails(eventId)
	})

	if (isLoading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<MiniLoader width={120} height={120} />
			</div>
		)
	}

	const event = data?.data

	if (!event) {
		return (
			<div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8">
				<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-white shadow-xl sm:rounded-3xl sm:p-8">
					<h1 className="break-words text-2xl font-bold [overflow-wrap:anywhere] sm:text-3xl">
						Мероприятие недоступно
					</h1>
					<p className="mt-4 break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
						Не удалось загрузить подробную информацию о мероприятии.
					</p>
				</div>
			</div>
		)
	}

	const eventHref = GUEST_PAGES.event(event.slug || event.idEvent)
	const isOnline = event.format === 'ONLINE'
	const eventAddress = isOnline ? null : event.address
	const hasMap = !isOnline && event.cordinatX != null && event.cordinatY != null

	return (
		<div className="mx-auto grid max-w-7xl gap-4 overflow-hidden px-3 py-4 text-white sm:gap-6 sm:px-4 sm:py-8">
			<Link
				href={eventHref}
				className="inline-flex w-fit text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200 hover:underline"
			>
				Назад к мероприятию
			</Link>

			<section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:rounded-3xl sm:p-8">
				<p className="break-words text-[10px] uppercase tracking-[0.16em] text-zinc-500 [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.2em]">
					О мероприятии
				</p>
				<h1 className="mt-3 max-w-5xl whitespace-normal break-words text-2xl font-bold leading-tight [overflow-wrap:anywhere] sm:text-3xl">
					{event.title}
				</h1>
				<p className="mt-5 max-w-6xl whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]">
					{event.description || 'Описание мероприятия отсутствует.'}
				</p>
			</section>

			<section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:rounded-3xl sm:p-8">
				<h2 className="break-words text-xl font-bold [overflow-wrap:anywhere] sm:text-2xl">
					Контакты и место проведения
				</h2>
				<div className="mt-5 grid gap-4 md:grid-cols-2">
					<InfoRow label="Организация" value={event.organization.name} />
					<InfoRow
						label="Период проведения"
						value={formatDateRange(event.dataStart, event.dataEnd)}
					/>
					<InfoRow label="Email" value={event.organization.email} />
					<InfoRow label="Контакт" value={event.organization.contact} />
					<InfoRow label="Формат" value={event.format} />
					<InfoRow label="Адрес" value={eventAddress || 'Не указана'} />
				</div>
			</section>

			{hasMap ? (
				<section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:rounded-3xl sm:p-8">
					<div className="[&>div>div]:h-80 sm:[&>div>div]:h-[460px]">
						<ArcGisPointMap
							cordinatX={event.cordinatX ?? null}
							cordinatY={event.cordinatY ?? null}
						/>
					</div>
				</section>
			) : null}
		</div>
	)
}
