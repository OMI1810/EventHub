import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common'
import { SaveUserEventSolutionDto } from './dto/save-user-event-solution.dto'
import { SelectUserEventCaseDto } from './dto/select-user-event-case.dto'
import { UserEventsService } from './user-events.service'

@Controller('user-events')
export class UserEventsController {
	constructor(private readonly userEventsService: UserEventsService) {}

	@Auth()
	@Get('feed')
	async getFeed(@CurrentUser('idUser') userId: string) {
		return this.userEventsService.getFeed(userId)
	}

	@Auth()
	@Get('my')
	async getMyEvents(@CurrentUser('idUser') userId: string) {
		return this.userEventsService.getMyEvents(userId)
	}

	@Auth()
	@Get(':eventId')
	async getEventDetails(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string
	) {
		return this.userEventsService.getEventDetails(userId, eventId)
	}

	@Auth()
	@HttpCode(200)
	@Post(':eventId/participate')
	async participate(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string
	) {
		return this.userEventsService.participate(userId, eventId)
	}

	@Auth()
	@HttpCode(200)
	@Post(':eventId/leave')
	async leave(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string
	) {
		return this.userEventsService.leave(userId, eventId)
	}

	@Auth()
	@HttpCode(200)
	@Post(':eventId/select-case')
	async selectCase(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string,
		@Body() dto: SelectUserEventCaseDto
	) {
		return this.userEventsService.selectCase(userId, eventId, dto.caseId)
	}

	@Auth()
	@HttpCode(200)
	@Post(':eventId/solution')
	async saveSolution(
		@CurrentUser('idUser') userId: string,
		@Param('eventId') eventId: string,
		@Body() dto: SaveUserEventSolutionDto
	) {
		return this.userEventsService.saveSolution(userId, eventId, dto)
	}
}
