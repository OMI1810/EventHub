class GuestPages {
	HOME = '/guest'

	EVENTS = `${this.HOME}/events`

	event(idEvent: string) {
		return `${this.EVENTS}/${idEvent}`
	}

	eventAbout(idEvent: string) {
		return `${this.event(idEvent)}/about`
	}
}

export const GUEST_PAGES = new GuestPages()
