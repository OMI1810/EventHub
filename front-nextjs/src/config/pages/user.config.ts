class UserPages {
	HOME = '/user'

	EVENTS = `${this.HOME}/events`
	REQUESTS = `${this.HOME}/requests`

	event(idEvent: string) {
		return `${this.EVENTS}/${idEvent}`
	}
}

export const USER_PAGES = new UserPages()
