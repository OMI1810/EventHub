import { axiosClassic, instance } from '@/api/axios'
import {
	IAuthResponse,
	IFormData,
	TLoginResponse
} from '@/types/auth.types'
import { AxiosResponse } from 'axios'
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
		type: 'login',
		data: IFormData
	): Promise<AxiosResponse<TLoginResponse>>
	async main(
		type: 'register',
		data: IFormData
	): Promise<AxiosResponse<IAuthResponse>>
	async main(
		type: 'login' | 'register',
		data: IFormData
	): Promise<AxiosResponse<TLoginResponse | IAuthResponse>> {
		const response = await axiosClassic.post<TLoginResponse | IAuthResponse>(
			`/auth/${type}`,
			data
		)

		if ('accessToken' in response.data && response.data.accessToken) {
			authTokenService.saveAccessToken(response.data.accessToken)
		}

		return response
	}

	async verifyTwoFactor(data: { twoFactorToken: string; code: string }) {
		const response = await axiosClassic.post<IAuthResponse>(
			'/auth/login/verify-2fa',
			data
		)

		if (response.data.accessToken) {
			authTokenService.saveAccessToken(response.data.accessToken)
		}

		return response
	}

	async resendTwoFactor(twoFactorToken: string) {
		return axiosClassic.post<{ success: boolean; twoFactorToken: string }>(
			'/auth/login/resend-2fa',
			{
				twoFactorToken
			}
		)
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
