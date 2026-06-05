import { AuthToken } from '@/types/auth.types'
import Cookies from 'js-cookie'

class AuthTokenService {
	private readonly cookieDomain =
		process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined

	getAccessToken() {
		const accessToken = Cookies.get(AuthToken.ACCESS_TOKEN)
		return accessToken || null
	}

	saveAccessToken(accessToken: string) {
		Cookies.set(AuthToken.ACCESS_TOKEN, accessToken, {
			domain: this.cookieDomain,
			sameSite: 'strict',
			expires: 1
		})
	}

	removeAccessToken() {
		Cookies.remove(AuthToken.ACCESS_TOKEN)
	}
}

export default new AuthTokenService()
