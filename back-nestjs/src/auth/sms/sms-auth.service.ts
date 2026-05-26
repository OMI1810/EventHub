import { PrismaService } from '@/prisma.service'
import { SmsService } from '@/sms/sms.service'

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class SmsAuthService {
	constructor(
		private readonly smsService: SmsService,
		private readonly prisma: PrismaService
	) {}

	async sendCode(
		userId: string,
		phone: string,
		channel: 'sms' | 'whatsapp' = 'sms'
	): Promise<{ message: string }> {
		const user = await this.prisma.user.findUnique({
			where: { idUser: userId }
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		const code = this.generateCode()
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 минут

		await this.prisma.user.update({
			where: { idUser: userId },
			data: {
				phone,
				otpCode: code,
				otpExpiresAt: expiresAt
			}
		})

		const messageText = `Your verification code: ${code}`

		if (channel === 'sms') {
			await this.smsService.sendSms(phone, messageText)
		} else {
			await this.smsService.sendWhatsApp(phone, messageText)
		}

		return { message: 'Код успешно отправлен!' }
	}

	async verifyCode(userId: string, code: string) {
		const user = await this.prisma.user.findUnique({
			where: { idUser: userId }
		})

		if (!user || !user.otpCode || !user.otpExpiresAt) {
			throw new BadRequestException('No OTP found for this user')
		}

		if (user.otpExpiresAt < new Date() || user.otpCode !== code) {
			throw new BadRequestException('Invalid or expired code')
		}

		// После успешной проверки очищаем OTP-поля
		await this.prisma.user.update({
			where: { idUser: user.idUser },
			data: { otpCode: null, otpExpiresAt: null }
		})

		return { message: 'Phone verified successfully', user }
	}

	private generateCode(): string {
		return Math.floor(1000 + Math.random() * 9000).toString()
	}
}
