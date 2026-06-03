import { EventStatus } from '@prisma/client'

export interface EventTimeStateInput {
	status: EventStatus
	dataStart: Date
	dataEnd: Date
	dataStartRegistration?: Date | null
	dataEndRegistration?: Date | null
	dateDeadLine?: Date | null
	hasCases: boolean
}

export interface CaseTimeStateInput {
	dateForStartSelected: Date
	dateForEndSelected: Date
	dateStopCode: Date
	isOpen?: boolean
}

export function getEventTimeState(event: EventTimeStateInput, now = new Date()) {
	const isPrivate = event.status === EventStatus.PRIVATE
	const isEventStarted = now >= event.dataStart
	const isEventFinished = now >= event.dataEnd
	const isRegistrationStarted = event.dataStartRegistration
		? now >= event.dataStartRegistration
		: true
	const isRegistrationFinished = event.dataEndRegistration
		? now >= event.dataEndRegistration
		: false
	const isRegistrationOpen =
		!isPrivate &&
		!isEventStarted &&
		isRegistrationStarted &&
		!isRegistrationFinished
	const solutionDeadline = event.hasCases ? null : event.dateDeadLine
	const isSolutionDeadlinePassed = solutionDeadline
		? now >= solutionDeadline
		: false

	return {
		isPrivate,
		isRegistrationStarted,
		isRegistrationOpen,
		isRegistrationFinished,
		isEventStarted,
		isEventFinished,
		canManageTeams: !isEventStarted,
		canViewEventMaterials: isEventStarted,
		canUploadSolution: isEventStarted && !isEventFinished && !isSolutionDeadlinePassed,
		solutionDeadline,
		isSolutionDeadlinePassed
	}
}

export function getCaseTimeState(eventCase: CaseTimeStateInput, now = new Date()) {
	const isCaseSelectionStarted = now >= eventCase.dateForStartSelected
	const isCaseSelectionFinished = now >= eventCase.dateForEndSelected
	const isCaseSelectionOpen =
		Boolean(eventCase.isOpen ?? true) &&
		isCaseSelectionStarted &&
		!isCaseSelectionFinished
	const isCaseSolutionDeadlinePassed = now >= eventCase.dateStopCode

	return {
		isCaseSelectionStarted,
		isCaseSelectionOpen,
		isCaseSelectionFinished,
		canViewCaseMaterials: false,
		canUploadCaseSolution: !isCaseSolutionDeadlinePassed,
		isCaseSolutionDeadlinePassed,
		solutionDeadline: eventCase.dateStopCode
	}
}
