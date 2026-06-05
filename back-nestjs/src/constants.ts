export const API_URL =
	process.env.BACKEND_PUBLIC_URL ||
	`http://localhost:${process.env.PORT || 4200}`
export const VERIFY_EMAIL_URL = `${API_URL}/verify-email?token=`
