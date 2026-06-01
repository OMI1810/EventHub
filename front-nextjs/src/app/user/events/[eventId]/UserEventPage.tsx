'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import userEventService from '@/services/user-event.service'
import { useQuery } from '@tanstack/react-query'
import { UserEventHeader } from './UserEventHeader'
import { UserEventTabs } from './UserEventTabs'

interface Props {
	eventId: string
}

export function UserEventPage({ eventId }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['user-events', 'details', eventId],
		queryFn: () => userEventService.getEventDetails(eventId)
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
			<div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
				<h1 className="text-3xl font-bold">Мероприятие недоступно</h1>
				<p className="mt-4 text-sm text-zinc-400">
					Не удалось загрузить информацию о выбранном мероприятии.
				</p>
			</div>
		)
	}

	return (
		<div className="grid gap-6">
			<UserEventHeader event={event} />
			<UserEventTabs event={event} />
		</div>
	)
}
