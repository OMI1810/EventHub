import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Patch,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Auth()
	@Get('profile')
	async getProfile(@CurrentUser('idUser') id: string) {
		return this.userService.getById(id)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth()
	@Patch('update-email')
	async updateEmail(
		@CurrentUser('idUser') userId: string,
		@Body() dto: { email: string }
	) {
		return this.userService.update(userId, { email: dto.email })
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth()
	@Patch('profile')
	async updateProfile(
		@CurrentUser('idUser') userId: string,
		@Body() dto: UpdateUserProfileDto
	) {
		return this.userService.updateProfile(userId, dto)
	}

	@HttpCode(200)
	@Auth()
	@Delete('profile')
	async deleteProfile(@CurrentUser('idUser') userId: string) {
		return this.userService.deleteProfile(userId)
	}
}
