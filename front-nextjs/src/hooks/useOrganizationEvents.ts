import organizationService from '@/services/organization.service'
import {
	IOrganizationEventsPage,
	IOrganizationEventSummary
} from '@/types/organization.types'
import { useInfiniteQuery } from '@tanstack/react-query'

const ORGANIZATION_EVENTS_PAGE_SIZE = 30

function normalizeEventsPage(
	data: IOrganizationEventsPage | IOrganizationEventSummary[]
) {
	if (Array.isArray(data)) {
		return {
			items: data,
			nextOffset: null,
			hasMore: false
		}
	}

	return data
}

export function useOrganizationEvents() {
	const query = useInfiniteQuery({
		queryKey: ['organization', 'events', 'infinite'],
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			organizationService.getMyOrganizationEventsPage({
				limit: ORGANIZATION_EVENTS_PAGE_SIZE,
				offset: pageParam
			}),
		getNextPageParam: lastPage => {
			const page = normalizeEventsPage(lastPage.data)
			return page.nextOffset ?? undefined
		}
	})

	return {
		events:
			query.data?.pages.flatMap(page => normalizeEventsPage(page.data).items) ??
			[],
		isLoading: query.isLoading,
		error: query.error,
		hasMore: Boolean(query.hasNextPage),
		isLoadingMore: query.isFetchingNextPage,
		loadMore: query.fetchNextPage
	}
}
