import { instance } from '@/api/axios'
import {
	ISaveUserEventSolutionFormData,
	IUserEventDetails,
	IUserEventFeedItem,
	IUserEventFeedPage,
	IUserMyEventItem
} from '@/types/user-event.types'

class UserEventService {
	private readonly baseUrl = '/user-events'

	async getFeed(params?: { limit?: number; offset?: number }) {
		return instance.get<IUserEventFeedPage>(`${this.baseUrl}/feed`, {
			params
		})
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

	async leave(eventId: string) {
		return instance.post<{ success: boolean }>(`${this.baseUrl}/${eventId}/leave`)
	}

	async selectCase(eventId: string, caseId: string) {
		return instance.post<IUserEventDetails>(`${this.baseUrl}/${eventId}/select-case`, {
			caseId
		})
	}

	async saveSolution(eventId: string, data: ISaveUserEventSolutionFormData) {
		return instance.post<IUserEventDetails>(`${this.baseUrl}/${eventId}/solution`, data)
	}
}

export default new UserEventService()
