import { EventFormat } from './event-create.types'

export type UserEventStatus =
	| 'FINISHED'
	| 'PUBLISHED'
	| 'PRIVATE'

export interface IUserEventTimeState {
	isPrivate: boolean
	isRegistrationStarted: boolean
	isRegistrationOpen: boolean
	isRegistrationFinished: boolean
	isEventStarted: boolean
	isEventFinished: boolean
	canManageTeams: boolean
	canViewEventMaterials: boolean
	canUploadSolution: boolean
	solutionDeadline?: string | null
	isSolutionDeadlinePassed: boolean
}

export interface IUserCaseTimeState {
	isCaseSelectionStarted: boolean
	isCaseSelectionOpen: boolean
	isCaseSelectionFinished: boolean
	canViewCaseMaterials: boolean
	canUploadCaseSolution: boolean
	isCaseSolutionDeadlinePassed: boolean
	solutionDeadline: string
}

export interface IUserEventFeedItem {
	idEvent: string
	title: string
	description?: string | null
	slug: string
	type: string
	format: EventFormat
	status: UserEventStatus
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
	timeState: IUserEventTimeState
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

export interface IUserEventOrganization {
	idOrganization: string
	name: string
	description?: string | null
	address?: string | null
	email?: string | null
	contact?: string | null
}

export interface IUserEventCase {
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
	timeState: IUserCaseTimeState
}

export interface IUserSelectedEventCase extends IUserEventCase {}

export interface IUserEventMaterial {
	idMaterial: string
	title: string
	description?: string | null
	url: string
}

export interface IUserEventResult {
	idResult: string
	title: string
	place: number
	caseId?: string | null
	description?: string | null
	score?: number | null
	teamName?: string | null
	userName?: string | null
}

export interface IUserEventTeamContext {
	hasTeam: boolean
	teamId?: string | null
	isCaptain: boolean
	selectedCaseId?: string | null
}

export interface IUserEventSolution {
	idSolution: string
	urlSolution: string
	urlPresentation: string
	description?: string | null
	updatedAt: string
}

export interface IUserEventDetails extends IUserEventFeedItem {
	address: string
	cordinatX?: number | null
	cordinatY?: number | null
	dateDeadLine?: string | null
	participanInTeamLimit?: number | null
	selectedCaseId?: string | null
	organization: IUserEventOrganization
	cases: IUserEventCase[]
	materials: IUserEventMaterial[]
	selectedCase: IUserSelectedEventCase | null
	selectedCaseMaterials: IUserEventMaterial[]
	teamContext?: IUserEventTeamContext | null
	solution: IUserEventSolution | null
	results: IUserEventResult[]
}

export interface ISaveUserEventSolutionFormData {
	urlSolution: string
	urlPresentation: string
	description?: string
}
