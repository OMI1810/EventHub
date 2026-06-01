export type UserTeamFormat = 'ONLINE' | 'OFFLINE'

export interface IUserTeamMember {
	idUser: string
	name?: string | null
	surname?: string | null
	patronymic?: string | null
	email: string
	phone?: string | null
	contact?: string | null
	roleInTeam?: string | null
}

export interface IUserTeamJoinRequest {
	idJoinTeam: string
	status: 'PENDING' | 'ACCEPT' | 'REJECTED' | 'CANCELED'
	user: IUserTeamMember
}

export interface IUserTeamDetails {
	idTeam: string
	name: string
	description?: string | null
	format: UserTeamFormat
	isCaptain: boolean
	members: IUserTeamMember[]
	joinRequests: IUserTeamJoinRequest[]
}

export interface IUserTeamState {
	eventId: string
	hasTeams: boolean
	isParticipating: boolean
	canChooseFormat: boolean
	defaultFormat: UserTeamFormat
	teamMemberLimit?: number | null
	hasTeam: boolean
	isCaptain: boolean
	team: IUserTeamDetails | null
}

export interface ICreateUserTeamFormData {
	name: string
	description?: string
	format?: UserTeamFormat
}

export interface IUpdateUserTeamFormData {
	name?: string
	description?: string
	format?: UserTeamFormat
}

export interface IJoinTeamByInviteFormData {
	code: string
	eventId: string
}

export interface IUserTeamInviteResponse {
	code: string
	expiresAt: string
}
