import {
	IOrganizationAdminSummary,
	IOrganizationJoinRequestSummary
} from '@/types/organization.types'

export function getOrganizationAdminDisplayName(
	admin: IOrganizationAdminSummary
) {
	const fullName = [admin.surname, admin.name, admin.patronymic]
		.filter(Boolean)
		.join(' ')
		.trim()

	return fullName || admin.email
}

export function getOrganizationJoinRequestDisplayName(
	joinRequest: IOrganizationJoinRequestSummary
) {
	return getOrganizationAdminDisplayName(joinRequest.user)
}
