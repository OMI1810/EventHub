import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { SubmitUserRequestCodeDto } from './dto/submit-user-request-code.dto'
import { UserRequestsService } from './user-requests.service'

@Controller('user-requests')
export class UserRequestsController {
	constructor(private readonly userRequestsService: UserRequestsService) {}

	@Auth()
	@Get()
	async getMyRequests(@CurrentUser('idUser') userId: string) {
		return this.userRequestsService.getMyRequests(userId)
	}

	@Auth()
	@UsePipes(new ValidationPipe({ transform: true }))
	@HttpCode(200)
	@Post('by-code')
	async submitByCode(
		@CurrentUser('idUser') userId: string,
		@Body() dto: SubmitUserRequestCodeDto
	) {
		return this.userRequestsService.submitByCode(userId, dto.code)
	}

	@Auth()
	@HttpCode(200)
	@Post('team/:requestId/cancel')
	async cancelTeamRequest(
		@CurrentUser('idUser') userId: string,
		@Param('requestId') requestId: string
	) {
		return this.userRequestsService.cancelTeamRequest(userId, requestId)
	}

	@Auth()
	@HttpCode(200)
	@Post('event/:requestId/cancel')
	async cancelEventRequest(
		@CurrentUser('idUser') userId: string,
		@Param('requestId') requestId: string
	) {
		return this.userRequestsService.cancelEventRequest(userId, requestId)
	}
}
