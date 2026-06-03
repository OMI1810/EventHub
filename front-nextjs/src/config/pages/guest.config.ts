class GuestPages {
	HOME = '/guest'

	EVENTS = `${this.HOME}/events`

	event(idEvent: string) {
		return `${this.EVENTS}/${idEvent}`
	}
}

export const GUEST_PAGES = new GuestPages()
