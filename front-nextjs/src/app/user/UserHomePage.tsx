'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import userEventService from '@/services/user-event.service'
import { useQuery } from '@tanstack/react-query'
import { UserEventFeed } from './components/UserEventFeed'

export function UserHomePage() {
	const { data, isLoading } = useQuery({
		queryKey: ['user-events', 'feed'],
		queryFn: () => userEventService.getFeed()
	})

	if (isLoading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<MiniLoader width={120} height={120} />
			</div>
		)
	}

	return <UserEventFeed events={data?.data ?? []} />
}
