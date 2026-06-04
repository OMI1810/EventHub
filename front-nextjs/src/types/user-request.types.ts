import { EventFormat } from './event-create.types'

export type UserRequestStatus = 'PENDING' | 'ACCEPT' | 'REJECTED' | 'CANCELED'
export type UserRequestType = 'event' | 'team'

export interface IUserRequestEventInfo {
	idEvent: string
	slug: string
	title: string
	type: string
	format: EventFormat
	dataStart: string
	dataEnd: string
	organizationName: string
}

export interface IUserRequestTeamInfo {
	idTeam: string
	name: string
}

export interface IUserRequestItem {
	id: string
	type: UserRequestType
	status: UserRequestStatus
	event: IUserRequestEventInfo
	team?: IUserRequestTeamInfo
}

export interface ISubmitUserRequestCodeResponse {
	type: UserRequestType
}
