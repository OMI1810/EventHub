import { Controller, Get, Param } from '@nestjs/common'
import { PublicEventsService } from './public-events.service'

@Controller('public-events')
export class PublicEventsController {
	constructor(private readonly publicEventsService: PublicEventsService) {}

	@Get('feed')
	async getFeed() {
		return this.publicEventsService.getFeed()
	}

	@Get(':eventId')
	async getEventDetails(@Param('eventId') eventId: string) {
		return this.publicEventsService.getEventDetails(eventId)
	}
}
