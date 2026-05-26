import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { SmsAuthService } from './sms-auth.service'

@Controller('auth/sms')
export class SmsAuthController {
	constructor(private readonly smsAuthService: SmsAuthService) {}

	@Auth()
	@HttpCode(200)
	@Post('send-code')
	async sendCode(
		@CurrentUser('idUser') userId: string,
		@Body('phone') phone: string,
		@Body('channel') channel: 'sms' | 'whatsapp'
	) {
		return this.smsAuthService.sendCode(userId, phone, channel)
	}

	@Auth()
	@HttpCode(200)
	@Post('verify-code')
	async verifyCode(
		@CurrentUser('idUser') userId: string,
		@Body('code') code: string
	) {
		return this.smsAuthService.verifyCode(userId, code)
	}
}
