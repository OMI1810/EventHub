import { EventFormat, EventPublicationStatus } from './event-create.types'

export interface IUserEventFeedItem {
	idEvent: string
	title: string
	description?: string | null
	slug: string
	type: string
	format: EventFormat
	status: EventPublicationStatus
	dataStart: string
	dataEnd: string
	dataStartRegistration?: string | null
	dataEndRegistration?: string | null
	hasCases: boolean
	hasTeams: boolean
	hasMaterials: boolean
	hasLoadedSolution: boolean
	hasResualt: boolean
	hasParticipantLimit: boolean
	participantLimit?: number | null
	registeredUsersCount: number
	isParticipating: boolean
	canParticipate: boolean
	organization: {
		idOrganization: string
		name: string
	}
}

export interface IUserMyEventItem {
	idEvent: string
	title: string
	slug: string
	createAt: string
}
