import { instance } from '@/api/axios'
import {
	ICreateUserTeamFormData,
	IJoinTeamByInviteFormData,
	IUpdateUserTeamFormData,
	IUserTeamInviteResponse,
	IUserTeamState
} from '@/types/user-team.types'

class UserTeamService {
	private readonly baseUrl = '/user-teams'

	async getTeamState(eventId: string) {
		return instance.get<IUserTeamState>(`${this.baseUrl}/event/${eventId}`)
	}

	async createTeam(eventId: string, data: ICreateUserTeamFormData) {
		return instance.post<IUserTeamState>(`${this.baseUrl}/event/${eventId}`, data)
	}

	async updateTeam(teamId: string, data: IUpdateUserTeamFormData) {
		return instance.patch<IUserTeamState>(`${this.baseUrl}/${teamId}`, data)
	}

	async deleteTeam(teamId: string) {
		return instance.delete<{ success: boolean; eventId: string }>(
			`${this.baseUrl}/${teamId}`
		)
	}

	async createTeamInvite(teamId: string) {
		return instance.post<IUserTeamInviteResponse>(`${this.baseUrl}/${teamId}/invite`)
	}

	async joinByInvite(data: IJoinTeamByInviteFormData) {
		return instance.post<IUserTeamState>(`${this.baseUrl}/join-by-invite`, data)
	}

	async approveJoinRequest(requestId: string) {
		return instance.post<IUserTeamState>(
			`${this.baseUrl}/join-requests/${requestId}/approve`
		)
	}

	async rejectJoinRequest(requestId: string) {
		return instance.post<IUserTeamState>(
			`${this.baseUrl}/join-requests/${requestId}/reject`
		)
	}
}

export default new UserTeamService()
