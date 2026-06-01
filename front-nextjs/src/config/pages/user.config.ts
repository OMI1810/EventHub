class UserPages {
	HOME = '/user'

	EVENTS = `${this.HOME}/events`

	event(idEvent: string) {
		return `${this.EVENTS}/${idEvent}`
	}
}

export const USER_PAGES = new UserPages()
