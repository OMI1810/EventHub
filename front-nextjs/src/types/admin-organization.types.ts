export interface IAdminOrganizationOwner {
	idUser: string
	email: string
	contact?: string
}

export interface IAdminOrganizationSummary {
	idOrganization: string
	name: string
	description?: string
	address?: string
	cordinatX?: number | null
	cordinatY?: number | null
	owner: IAdminOrganizationOwner
}

export interface IAdminOrganizationRequestSummary {
	idJoinTeam: string
	status: 'PENDING' | 'ACCEPT' | 'REJECTED' | 'CANCELED'
	organization: IAdminOrganizationSummary
}

export interface ICreateAdminOrganizationRequestFormData {
	code: string
}
