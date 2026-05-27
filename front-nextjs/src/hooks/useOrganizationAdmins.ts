import organizationService from '@/services/organization.service'
import { useQuery } from '@tanstack/react-query'

export function useOrganizationAdmins() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['organization', 'admins'],
		queryFn: () => organizationService.getMyOrganizationAdmins()
	})

	return {
		admins: data?.data ?? [],
		isLoading,
		error
	}
}
