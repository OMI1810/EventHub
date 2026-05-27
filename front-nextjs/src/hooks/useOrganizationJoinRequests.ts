import organizationService from '@/services/organization.service'
import { useQuery } from '@tanstack/react-query'

export function useOrganizationJoinRequests() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['organization', 'join-requests'],
		queryFn: () => organizationService.getMyOrganizationJoinRequests()
	})

	return {
		joinRequests: data?.data ?? [],
		isLoading,
		error
	}
}
