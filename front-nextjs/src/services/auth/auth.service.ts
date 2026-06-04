import { axiosClassic, instance } from '@/api/axios'
import { IFormData } from '@/types/auth.types'
import { IUser } from '@/types/user.types'
import authTokenService from './auth-token.service'

interface IAuthResponse {
	user: IUser
	accessToken: string
}

interface ITurniketLoginData {
	login: string
	password: string
}

class AuthService {
	async main(
		type: 'login' | 'register',
		data: IFormData
	) {
		const response = await axiosClassic.post<IAuthResponse>(
			`/auth/${type}`,
			data
		)

		if (response.data.accessToken) {
			authTokenService.saveAccessToken(response.data.accessToken)
		}

		return response
	}

	async loginTurniket(data: ITurniketLoginData) {
		const response = await axiosClassic.post<IAuthResponse>(
			'/auth/turniket/login',
			data
		)

		if (response.data.accessToken) {
			authTokenService.saveAccessToken(response.data.accessToken)
		}

		return response
	}

	async getNewTokens() {
		const response = await axiosClassic.post<IAuthResponse>(
			'/auth/access-token'
		)

		if (response.data.accessToken)
			authTokenService.saveAccessToken(response.data.accessToken)

		return response
	}

	async logout() {
		const response = await axiosClassic.post<boolean>('/auth/logout')

		if (response.data) authTokenService.removeAccessToken()

		return response
	}

	async resendVerificationEmail() {
		return instance.post<{ success: boolean }>(
			'/auth/resend-verification-email'
		)
	}
}

export default new AuthService()
