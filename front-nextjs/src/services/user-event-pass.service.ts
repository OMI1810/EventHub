import { instance } from '@/api/axios'
import { API_URL } from '@/constants'
import authTokenService from '@/services/auth/auth-token.service'

export interface IUserEventPassTokenResponse {
	token: string
	qrPayload: string
	expiresAt: number
}

class UserEventPassService {
	async createToken(eventId: string) {
		return instance.post<IUserEventPassTokenResponse>(
			`/user-events/${eventId}/pass/token`
		)
	}

	async revokeToken(eventId: string, token: string) {
		return instance.post<{
			code: string
			revoked: boolean
			message: string
		}>(`/user-events/${eventId}/pass/revoke`, {
			token
		})
	}

	revokeTokenOnPageLeave(eventId: string, token: string) {
		const accessToken = authTokenService.getAccessToken()

		void fetch(`${API_URL}/user-events/${eventId}/pass/revoke`, {
			method: 'POST',
			keepalive: true,
			headers: {
				'Content-Type': 'application/json',
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
			},
			credentials: 'include',
			body: JSON.stringify({ token })
		}).catch(() => undefined)
	}
}

export default new UserEventPassService()
