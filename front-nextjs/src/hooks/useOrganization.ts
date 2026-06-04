import organizationService from '@/services/organization.service'
import { useQuery } from '@tanstack/react-query'

export function useOrganization(enabled = true) {
	const { data, isLoading, error } = useQuery({
		queryKey: ['organization', 'me'],
		queryFn: () => organizationService.getMyOrganization(),
		enabled,
		retry: false
	})

	return {
		organization: data?.data ?? null,
		isLoading,
		error
	}
}
