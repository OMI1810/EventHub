import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post
} from '@nestjs/common'
import { CreateUserTeamDto } from './dto/create-user-team.dto'
import { JoinTeamByInviteDto } from './dto/join-team-by-invite.dto'
import { UpdateUserTeamDto } from './dto/update-user-team.dto'
import { UserTeamsService } from './user-teams.service'

@Controller('user-teams')
export class UserTeamsController {
	constructor(private readonly userTeamsService: UserTeamsService) {}

	@Auth()
	@Get('event/:eventId')
	async getTeamState(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string
	) {
		return this.userTeamsService.getTeamState(userId, eventId)
	}

	@Auth()
	@Post('event/:eventId')
	async createTeam(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string,
		@Body() dto: CreateUserTeamDto
	) {
		return this.userTeamsService.createTeam(userId, eventId, dto)
	}

	@Auth()
	@Patch(':teamId')
	async updateTeam(
		@CurrentUser('idUser') userId: string,
		@Param('teamId') teamId: string,
		@Body() dto: UpdateUserTeamDto
	) {
		return this.userTeamsService.updateTeam(userId, teamId, dto)
	}

	@Auth()
	@Delete(':teamId')
	async deleteTeam(
		@CurrentUser('idUser') userId: string,
		@Param('teamId') teamId: string
	) {
		return this.userTeamsService.deleteTeam(userId, teamId)
	}

	@Auth()
	@HttpCode(200)
	@Post(':teamId/invite')
	async createTeamInvite(
		@CurrentUser('idUser') userId: string,
		@Param('teamId') teamId: string
	) {
		return this.userTeamsService.createTeamInvite(userId, teamId)
	}

	@Auth()
	@HttpCode(200)
	@Post('join-by-invite')
	async joinByInvite(
		@CurrentUser('idUser') userId: string,
		@Body() dto: JoinTeamByInviteDto
	) {
		return this.userTeamsService.joinByInvite(userId, dto)
	}

	@Auth()
	@HttpCode(200)
	@Post('join-requests/:requestId/approve')
	async approveJoinRequest(
		@CurrentUser('idUser') userId: string,
		@Param('requestId') requestId: string
	) {
		return this.userTeamsService.approveJoinRequest(userId, requestId)
	}

	@Auth()
	@HttpCode(200)
	@Post('join-requests/:requestId/reject')
	async rejectJoinRequest(
		@CurrentUser('idUser') userId: string,
		@Param('requestId') requestId: string
	) {
		return this.userTeamsService.rejectJoinRequest(userId, requestId)
	}
}
