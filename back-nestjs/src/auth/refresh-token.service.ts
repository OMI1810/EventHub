import { Injectable } from '@nestjs/common'
import type { CookieOptions, Response } from 'express'

@Injectable()
export class RefreshTokenService {
	readonly EXPIRE_DAY_REFRESH_TOKEN = 1
	readonly REFRESH_TOKEN_NAME = 'refreshToken'

	private getCookieOptions(expires: Date): CookieOptions {
		const isProduction = process.env.NODE_ENV === 'production'

		return {
			httpOnly: true,
			domain: process.env.COOKIE_DOMAIN || undefined,
			expires,
			secure: isProduction,
			sameSite: 'lax'
		}
	}

	addRefreshTokenToResponse(res: Response, refreshToken: string) {
		const expiresIn = new Date()
		expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN)

		res.cookie(
			this.REFRESH_TOKEN_NAME,
			refreshToken,
			this.getCookieOptions(expiresIn)
		)
	}

	removeRefreshTokenFromResponse(res: Response) {
		res.cookie(
			this.REFRESH_TOKEN_NAME,
			'',
			this.getCookieOptions(new Date(0))
		)
	}
}
