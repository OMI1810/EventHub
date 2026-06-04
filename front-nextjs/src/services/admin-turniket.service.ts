import { instance } from '@/api/axios'
import {
	ICreateTurniketAccountFormData,
	ICreatedTurniketAccount
} from '@/types/admin-turniket.types'

class AdminTurniketService {
	private readonly baseUrl = '/admin/turnikets'

	async createTurniketAccount(data: ICreateTurniketAccountFormData) {
		return instance.post<ICreatedTurniketAccount>(this.baseUrl, data)
	}
}

export default new AdminTurniketService()
