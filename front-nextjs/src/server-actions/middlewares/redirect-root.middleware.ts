'use server'

import { GUEST_PAGES } from '@/config/pages/guest.config'
import { AuthToken } from '@/types/auth.types'
import { getRoleHomePath } from '@/utils/get-role-home-path'
import { type NextRequest } from 'next/server'
import { getNewTokensByRefresh } from './utils/get-new-tokens-by-refresh'
import { getTokensFromRequest } from './utils/get-tokens-from-request'
import { jwtVerifyServer } from './utils/jwt-verify'
import { nextRedirect } from './utils/next-redirect'

export async function redirectRoot(request: NextRequest) {
	const tokens = await getTokensFromRequest(request)

	if (!tokens) {
		return nextRedirect(GUEST_PAGES.HOME, request.url)
	}

	const verifiedData = await jwtVerifyServer(tokens.accessToken)

	if (verifiedData) {
		return nextRedirect(getRoleHomePath(verifiedData.role), request.url)
	}

	try {
		const data = await getNewTokensByRefresh(tokens.refreshToken)
		const refreshedData = await jwtVerifyServer(data.accessToken)

		if (!refreshedData) {
			return nextRedirect(GUEST_PAGES.HOME, request.url)
		}

		const response = nextRedirect(
			getRoleHomePath(refreshedData.role),
			request.url
		)

		response.cookies.set(AuthToken.ACCESS_TOKEN, data.accessToken, {
			path: '/',
			sameSite: 'strict',
			maxAge: 60 * 60
		})

		return response
	} catch {
		return nextRedirect(GUEST_PAGES.HOME, request.url)
	}
}
