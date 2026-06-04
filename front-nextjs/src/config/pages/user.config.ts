class UserPages {
	HOME = '/user'

	EVENTS = `${this.HOME}/events`
	REQUESTS = `${this.HOME}/requests`

	event(idEvent: string) {
		return `${this.EVENTS}/${idEvent}`
	}

	eventAbout(idEvent: string) {
		return `${this.event(idEvent)}/about`
	}
}

export const USER_PAGES = new UserPages()
