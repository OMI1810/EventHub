import { instance } from '@/api/axios'
import {
	ISubmitUserRequestCodeResponse,
	IUserRequestItem
} from '@/types/user-request.types'

class UserRequestService {
	private readonly baseUrl = '/user-requests'

	async getMyRequests() {
		return instance.get<IUserRequestItem[]>(this.baseUrl)
	}

	async submitByCode(code: string) {
		return instance.post<ISubmitUserRequestCodeResponse>(`${this.baseUrl}/by-code`, {
			code
		})
	}

	async cancelTeamRequest(requestId: string) {
		return instance.post<{ success: boolean }>(
			`${this.baseUrl}/team/${requestId}/cancel`
		)
	}

	async cancelEventRequest(requestId: string) {
		return instance.post<{ success: boolean }>(
			`${this.baseUrl}/event/${requestId}/cancel`
		)
	}
}

export default new UserRequestService()
