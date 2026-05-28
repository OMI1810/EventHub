import { instance } from '@/api/axios'
import {
	ICreateAdminOrganizationRequestFormData,
	IAdminOrganizationRequestSummary,
	IAdminOrganizationSummary
} from '@/types/admin-organization.types'

class AdminOrganizationService {
	private readonly baseUrl = '/admin'

	async getOrganizations() {
		return instance.get<IAdminOrganizationSummary[]>(
			`${this.baseUrl}/organizations`
		)
	}

	async getOrganizationRequests() {
		return instance.get<IAdminOrganizationRequestSummary[]>(
			`${this.baseUrl}/organization-requests`
		)
	}

	async createOrganizationRequest(
		data: ICreateAdminOrganizationRequestFormData
	) {
		return instance.post<{ success: boolean }>(
			`${this.baseUrl}/organization-requests`,
			data
		)
	}

	async cancelOrganizationRequest(requestId: string) {
		return instance.post<{ success: boolean }>(
			`${this.baseUrl}/organization-requests/${requestId}/cancel`
		)
	}
}

export default new AdminOrganizationService()
