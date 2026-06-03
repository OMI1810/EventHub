import { IUserEventFeedItem } from '@/types/user-event.types'

type EventParticipationSnapshot = Pick<
	IUserEventFeedItem,
	| 'status'
	| 'dataStartRegistration'
	| 'dataEndRegistration'
	| 'hasParticipantLimit'
	| 'participantLimit'
	| 'registeredUsersCount'
	| 'isParticipating'
	| 'timeState'
>

export function getParticipationBlockedReason(
	event: EventParticipationSnapshot
): string | null {
	if (event.isParticipating) {
		return null
	}

	if (event.status === 'PRIVATE') {
		return 'Это приватное мероприятие. Вступить можно только по коду приглашения.'
	}

	if (event.status === 'FINISHED') {
		return 'Мероприятие уже завершено.'
	}

	const registrationStart = event.dataStartRegistration
		? new Date(event.dataStartRegistration)
		: null
	const registrationEnd = event.dataEndRegistration
		? new Date(event.dataEndRegistration)
		: null
	const hasBrokenRegistrationWindow =
		registrationStart && registrationEnd && registrationStart > registrationEnd

	if (
		!hasBrokenRegistrationWindow &&
		registrationStart &&
		!event.timeState.isRegistrationStarted
	) {
		return `Регистрация ещё не началась. Старт: ${registrationStart.toLocaleString(
			'ru-RU'
		)}.`
	}

	if (
		!hasBrokenRegistrationWindow &&
		registrationEnd &&
		event.timeState.isRegistrationFinished
	) {
		return `Регистрация уже завершена. Окончание: ${registrationEnd.toLocaleString(
			'ru-RU'
		)}.`
	}

	if (!event.timeState.isRegistrationOpen) {
		return 'Регистрация на это мероприятие сейчас недоступна.'
	}

	const participantLimit = event.participantLimit

	if (
		event.hasParticipantLimit &&
		participantLimit !== null &&
		participantLimit !== undefined &&
		event.registeredUsersCount >= participantLimit
	) {
		return `Свободных мест больше нет: ${event.registeredUsersCount} из ${participantLimit}.`
	}

	return null
}
