import { instance } from '@/api/axios'
import {
	IOrganizationAdminSummary,
	IOrganizationEventSummary,
	IOrganizationInviteResponse,
	IOrganizationJoinRequestSummary,
	IOrganizationSummary,
	ICreateOrganizationFormData,
	IUpdateOrganizationFormData
} from '@/types/organization.types'

class OrganizationService {
	private readonly BASE_URL = '/organization'

	async getMyOrganization() {
		return instance.get<IOrganizationSummary>(`${this.BASE_URL}/me`)
	}

	async createMyOrganization(data: ICreateOrganizationFormData) {
		return instance.post<IOrganizationSummary>(`${this.BASE_URL}/me`, data)
	}

	async updateMyOrganization(data: IUpdateOrganizationFormData) {
		return instance.patch<IOrganizationSummary>(`${this.BASE_URL}/me`, data)
	}

	async getMyOrganizationAdmins() {
		return instance.get<IOrganizationAdminSummary[]>(`${this.BASE_URL}/me/admins`)
	}

	async getMyOrganizationEvents() {
		return instance.get<IOrganizationEventSummary[]>(`${this.BASE_URL}/me/events`)
	}

	async removeAdminFromMyOrganization(adminId: string) {
		return instance.delete<{ success: boolean }>(
			`${this.BASE_URL}/me/admins/${adminId}`
		)
	}

	async deleteMyOrganizationAccount() {
		return instance.delete<{ success: boolean }>(`${this.BASE_URL}/me`)
	}

	async createInviteForMyOrganization() {
		return instance.post<IOrganizationInviteResponse>(`${this.BASE_URL}/me/invite`)
	}

	async getMyOrganizationJoinRequests() {
		return instance.get<IOrganizationJoinRequestSummary[]>(
			`${this.BASE_URL}/me/join-requests`
		)
	}

	async approveMyOrganizationJoinRequest(requestId: string) {
		return instance.post<{ success: boolean }>(
			`${this.BASE_URL}/me/join-requests/${requestId}/approve`
		)
	}

	async rejectMyOrganizationJoinRequest(requestId: string) {
		return instance.post<{ success: boolean }>(
			`${this.BASE_URL}/me/join-requests/${requestId}/reject`
		)
	}
}

export default new OrganizationService()
