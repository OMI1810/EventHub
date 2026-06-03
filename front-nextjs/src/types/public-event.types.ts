import { EventFormat } from './event-create.types'

export type PublicEventStatus =
	| 'FINISHED'
	| 'PUBLISHED'
	| 'PRIVATE'

export interface IPublicEventFeedItem {
	idEvent: string
	title: string
	description?: string | null
	slug: string
	type: string
	format: EventFormat
	status: PublicEventStatus
	dataStart: string
	dataEnd: string
	dataStartRegistration?: string | null
	dataEndRegistration?: string | null
	hasCases: boolean
	hasTeams: boolean
	hasMaterials: boolean
	hasLoadedSolution: boolean
	hasResualt: boolean
	organization: {
		idOrganization: string
		name: string
	}
}

export interface IPublicEventOrganization {
	idOrganization: string
	name: string
	description?: string | null
	address?: string | null
	email?: string | null
	contact?: string | null
}

export interface IPublicEventCase {
	idCase: string
	title: string
	description?: string | null
	holder?: string | null
	teamLimit?: number | null
	isOpen: boolean
	dateForStartSelected: string
	dateForEndSelected: string
	dateStopCode: string
	occupiedPlaces: number
}

export interface IPublicEventMaterial {
	idMaterial: string
	title: string
	description?: string | null
	url: string
}

export interface IPublicEventResult {
	idResult: string
	title: string
	place: number
	description?: string | null
	score?: number | null
	teamName?: string | null
	userName?: string | null
}

export interface IPublicEventDetails extends IPublicEventFeedItem {
	address: string
	cordinatX?: number | null
	cordinatY?: number | null
	dateDeadLine?: string | null
	organization: IPublicEventOrganization
	cases: IPublicEventCase[]
	materials: IPublicEventMaterial[]
	results: IPublicEventResult[]
}
