import { instance } from '@/api/axios'
import { IUserEventFeedItem, IUserMyEventItem } from '@/types/user-event.types'

class UserEventService {
	private readonly baseUrl = '/user-events'

	async getFeed() {
		return instance.get<IUserEventFeedItem[]>(`${this.baseUrl}/feed`)
	}

	async getMyEvents() {
		return instance.get<IUserMyEventItem[]>(`${this.baseUrl}/my`)
	}

	async participate(eventId: string) {
		return instance.post<{ success: boolean }>(
			`${this.baseUrl}/${eventId}/participate`
		)
	}
}

export default new UserEventService()
