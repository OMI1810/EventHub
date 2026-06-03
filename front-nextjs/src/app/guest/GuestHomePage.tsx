'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import publicEventService from '@/services/public-event.service'
import { useQuery } from '@tanstack/react-query'
import { GuestEventFeed } from './components/GuestEventFeed'

export function GuestHomePage() {
	const { data, isLoading } = useQuery({
		queryKey: ['public-events', 'feed'],
		queryFn: () => publicEventService.getFeed()
	})

	if (isLoading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<MiniLoader width={120} height={120} />
			</div>
		)
	}

	return <GuestEventFeed events={data?.data ?? []} />
}
