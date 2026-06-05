const BACKEND_MAIN = (
	process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200'
).replace(/\/+$/, '')
export const API_URL = `${BACKEND_MAIN}/api`
export const BACKEND_SOCIAL_AUTH_URL = `${BACKEND_MAIN}/auth`
export const TG_AUTH_REDIRECT_URL = `${BACKEND_SOCIAL_AUTH_URL}/telegram/redirect`
