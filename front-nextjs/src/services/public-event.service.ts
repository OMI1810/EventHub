import { instance } from '@/api/axios'
import {
	IPublicEventDetails,
	IPublicEventFeedItem
} from '@/types/public-event.types'

class PublicEventService {
	private readonly baseUrl = '/public-events'

	async getFeed() {
		return instance.get<IPublicEventFeedItem[]>(`${this.baseUrl}/feed`)
	}

	async getEventDetails(eventId: string) {
		return instance.get<IPublicEventDetails>(`${this.baseUrl}/${eventId}`)
	}
}

export default new PublicEventService()
