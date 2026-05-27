import organizationService from '@/services/organization.service'
import { useQuery } from '@tanstack/react-query'

export function useOrganization() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['organization', 'me'],
		queryFn: () => organizationService.getMyOrganization()
	})

	return {
		organization: data?.data ?? null,
		isLoading,
		error
	}
}
