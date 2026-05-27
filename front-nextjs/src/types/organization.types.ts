import { TRole } from './user.types'

export interface IOrganizationOwnerSummary {
	idUser: string
	email: string
	phone?: string
	contact?: string
	role: TRole
}

export interface IOrganizationSummary {
	idOrganization: string
	name: string
	description?: string
	address?: string
	owner: IOrganizationOwnerSummary
}

export interface IOrganizationAdminSummary {
	idUser: string
	surname?: string
	name?: string
	patronymic?: string
	email: string
	phone?: string
	contact?: string
	role?: TRole
}

export interface IUpdateOrganizationFormData {
	phone?: string
	contact?: string
	name?: string
	description?: string
	address?: string
}

export interface IOrganizationInviteResponse {
	code: string
	expiresAt: string
}

export interface IOrganizationJoinRequestSummary {
	idJoinTeam: string
	status: 'PENDING' | 'ACCEPT' | 'REJECTED' | 'CANCELED'
	user: IOrganizationAdminSummary
}
