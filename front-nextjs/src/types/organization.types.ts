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
	cordinatX?: number | null
	cordinatY?: number | null
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

export interface IOrganizationEventSummary {
	idEvent: string
	title: string
	description?: string
	type: string
	format: 'OFFLINE' | 'ONLINE' | 'HYBRID'
	status:
		| 'FINISHED'
		| 'OPEN'
		| 'PUBLISHED'
		| 'PRIVATE'
		| 'OPEN_REGISTRATION'
		| 'CLOSED_REGISTRATION'
	dataStart: string
	dataEnd: string
	hasTeams: boolean
	hasCases: boolean
	hasLoadedSolution: boolean
	hasMaterials: boolean
	hasResualt: boolean
	participantsCount: number
	teamsCount: number
}

export interface IUpdateOrganizationFormData {
	phone?: string
	contact?: string
	name?: string
	description?: string
	address?: string
	cordinatX?: number
	cordinatY?: number
}

export interface ICreateOrganizationFormData {
	name: string
	description?: string
	address: string
	cordinatX?: number
	cordinatY?: number
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
