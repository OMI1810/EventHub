import { EventEntryDecisionCode } from '@prisma/client'

export interface EventPassPayload {
	sub: string
	jti: string
	eventId: string
	typ: string
	iss: string
	aud: string
	exp: number
}

export type PassEligibilityResult =
	| {
			allowed: true
			reason: null
			eventId: string
			userId: string
			eventTitle: string
			userDisplayName: string
			teamId: string | null
			caseId: string | null
	  }
	| {
			allowed: false
			reason: string
			eventId: string | null
			userId: string | null
			eventTitle: string | null
			userDisplayName: string | null
			teamId: string | null
			caseId: string | null
	  }

export interface PassDecisionResponse {
	code: EventEntryDecisionCode
	allow: boolean
	message: string
}
