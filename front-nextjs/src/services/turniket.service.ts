import { instance } from '@/api/axios'

export interface ITurniketVerifyResponse {
	code: string
	allow: boolean
	message: string
}

class TurniketService {
	async verifyConsume(token: string, turniketDeviceId?: string) {
		return instance.post<ITurniketVerifyResponse>('/turniket/verify-consume', {
			token,
			turniketDeviceId
		})
	}
}

export default new TurniketService()
