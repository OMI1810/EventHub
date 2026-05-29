import { instance } from '@/api/axios'
import {
	IAdminProfile,
	IUpdateAdminProfileFormData
} from '@/types/admin-profile.types'

class AdminProfileService {
	private readonly baseUrl = '/admin/profile'

	async getProfile() {
		return instance.get<IAdminProfile>(this.baseUrl)
	}

	async updateProfile(data: IUpdateAdminProfileFormData) {
		return instance.patch<IAdminProfile>(this.baseUrl, data)
	}

	async deleteProfile() {
		return instance.delete<{ success: boolean }>(this.baseUrl)
	}
}

export default new AdminProfileService()
