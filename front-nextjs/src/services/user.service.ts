import { instance } from '@/api/axios'
import { IProfile, IUpdateProfileFormData } from '@/types/profile.types'

class UserService {
	private _BASE_URL = '/users'

	async fetchProfile() {
		return instance.get<IProfile>(`${this._BASE_URL}/profile`)
	}

	async updateUserEmail(email: string) {
		return instance.patch(`${this._BASE_URL}/update-email`, { email })
	}

	async updateProfile(data: IUpdateProfileFormData) {
		return instance.patch<IProfile>(`${this._BASE_URL}/profile`, data)
	}

	async deleteProfile() {
		return instance.delete<{ success: boolean }>(`${this._BASE_URL}/profile`)
	}
}

export default new UserService()
