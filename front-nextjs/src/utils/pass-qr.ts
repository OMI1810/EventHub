import { PASS_QR_PREFIX } from './pass-qr.constants'

export function buildPassQrPayload(token: string) {
	return `${PASS_QR_PREFIX}${token}`
}

export function parsePassQrPayload(rawValue: string) {
	const trimmed = rawValue.trim()

	if (!trimmed.startsWith(PASS_QR_PREFIX)) {
		return null
	}

	const token = trimmed.slice(PASS_QR_PREFIX.length).trim()
	return token ? token : null
}
