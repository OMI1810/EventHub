import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common'
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
}
