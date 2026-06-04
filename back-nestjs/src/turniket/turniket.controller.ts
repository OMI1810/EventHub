import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import { Body, Controller, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common'
import { VerifyTurniketPassDto } from './dto/verify-turniket-pass.dto'
import { TurniketService } from './turniket.service'

@Controller('turniket')
export class TurniketController {
	constructor(private readonly turniketService: TurniketService) {}

	@Auth()
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('verify-consume')
	async verifyConsume(
		@CurrentUser('idUser') userId: string,
		@Body() dto: VerifyTurniketPassDto
	) {
		return this.turniketService.verifyAndConsume(
			userId,
			dto.token,
			dto.turniketDeviceId
		)
	}
}
