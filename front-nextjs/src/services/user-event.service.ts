import { instance } from '@/api/axios'
import {
	IUserEventDetails,
	IUserEventFeedItem,
	IUserMyEventItem
} from '@/types/user-event.types'

class UserEventService {
	private readonly baseUrl = '/user-events'

	async getFeed() {
		return instance.get<IUserEventFeedItem[]>(`${this.baseUrl}/feed`)
	}

	async getMyEvents() {
		return instance.get<IUserMyEventItem[]>(`${this.baseUrl}/my`)
	}

	async getEventDetails(eventId: string) {
		return instance.get<IUserEventDetails>(`${this.baseUrl}/${eventId}`)
	}

	async participate(eventId: string) {
		return instance.post<{ success: boolean }>(
			`${this.baseUrl}/${eventId}/participate`
		)
	}
}

export default new UserEventService()
