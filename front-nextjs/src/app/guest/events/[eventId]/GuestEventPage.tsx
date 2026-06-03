'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import publicEventService from '@/services/public-event.service'
import { useQuery } from '@tanstack/react-query'
import { GuestEventHeader } from './GuestEventHeader'
import { GuestEventTabs } from './GuestEventTabs'

interface Props {
	eventId: string
}

export function GuestEventPage({ eventId }: Props) {
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
			<div className="mx-auto max-w-7xl px-4 py-8">
				<div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
					<h1 className="text-3xl font-bold">Мероприятие недоступно</h1>
					<p className="mt-4 text-sm text-zinc-400">
						Не удалось загрузить информацию о выбранном мероприятии.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-white">
			<GuestEventHeader event={event} />
			<GuestEventTabs event={event} />
		</div>
	)
}
