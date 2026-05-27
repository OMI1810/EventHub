'use server'

import { AuthToken } from '@/types/auth.types'
import { type NextRequest, NextResponse } from 'next/server'
import { getNewTokensByRefresh } from './utils/get-new-tokens-by-refresh'
import { getTokensFromRequest } from './utils/get-tokens-from-request'
import { jwtVerifyServer } from './utils/jwt-verify'
import { redirectToLoginOrNotFound } from './utils/redirect-to-login-or-404'

export async function protectDashboardPages(request: NextRequest) {
	const tokens = await getTokensFromRequest(request)
	if (!tokens) return redirectToLoginOrNotFound(request)

	const verifiedData = await jwtVerifyServer(tokens.accessToken)
	if (verifiedData) return NextResponse.next()

	try {
		const data = await getNewTokensByRefresh(tokens.refreshToken)
		const refreshedData = await jwtVerifyServer(data.accessToken)

		if (!refreshedData) return redirectToLoginOrNotFound(request)

		const response = NextResponse.next()
		response.cookies.set(AuthToken.ACCESS_TOKEN, data.accessToken, {
			path: '/',
			sameSite: 'strict',
			maxAge: 60 * 60
		})

		return response
	} catch {
		return redirectToLoginOrNotFound(request)
	}
}
