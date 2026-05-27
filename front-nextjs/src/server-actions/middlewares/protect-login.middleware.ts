'use server'

import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { AuthToken } from '@/types/auth.types'
import { type NextRequest, NextResponse } from 'next/server'
import { getNewTokensByRefresh } from './utils/get-new-tokens-by-refresh'
import { getTokensFromRequest } from './utils/get-tokens-from-request'
import { jwtVerifyServer } from './utils/jwt-verify'
import { nextRedirect } from './utils/next-redirect'

export async function protectLoginPages(request: NextRequest) {
	const tokens = await getTokensFromRequest(request)
	if (!tokens) return NextResponse.next()

	const verifiedData = await jwtVerifyServer(tokens.accessToken)
	if (verifiedData) return nextRedirect(DASHBOARD_PAGES.PROFILE, request.url)

	try {
		const data = await getNewTokensByRefresh(tokens.refreshToken)
		const refreshedData = await jwtVerifyServer(data.accessToken)

		if (!refreshedData) return NextResponse.next()

		const response = nextRedirect(DASHBOARD_PAGES.PROFILE, request.url)
		response.cookies.set(AuthToken.ACCESS_TOKEN, data.accessToken, {
			path: '/',
			sameSite: 'strict',
			maxAge: 60 * 60
		})

		return response
	} catch {
		return NextResponse.next()
	}
}
