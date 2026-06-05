'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import userEventService from '@/services/user-event.service'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { UserEventFeed } from './components/UserEventFeed'

const FEED_PAGE_SIZE = 30

export function UserHomePage() {
	const loadMoreRef = useRef<HTMLDivElement | null>(null)
	const {
		data,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage
	} = useInfiniteQuery({
		queryKey: ['user-events', 'feed', 'infinite'],
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			userEventService.getFeed({
				limit: FEED_PAGE_SIZE,
				offset: pageParam
			}),
		getNextPageParam: lastPage =>
			Array.isArray(lastPage.data) ? undefined : lastPage.data.nextOffset ?? undefined
	})

	const events = useMemo(
		() =>
			data?.pages.flatMap(page =>
				Array.isArray(page.data) ? page.data : page.data.items
			) ?? [],
		[data]
	)

	useEffect(() => {
		const element = loadMoreRef.current
		if (!element || !hasNextPage) return

		const observer = new IntersectionObserver(
			entries => {
				const entry = entries[0]
				if (entry?.isIntersecting && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{
				rootMargin: '360px 0px'
			}
		)

		observer.observe(element)

		return () => {
			observer.disconnect()
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

	if (isLoading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<MiniLoader width={120} height={120} />
			</div>
		)
	}

	return (
		<UserEventFeed
			events={events}
			loadMoreRef={loadMoreRef}
			hasMore={Boolean(hasNextPage)}
			isLoadingMore={isFetchingNextPage}
		/>
	)
}
