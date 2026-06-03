import organizationService from '@/services/organization.service'
import { useQuery } from '@tanstack/react-query'

export function useOrganizationEvents() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['organization', 'events'],
		queryFn: () => organizationService.getMyOrganizationEvents()
	})

	return {
		events: data?.data ?? [],
		isLoading,
		error
	}
}
