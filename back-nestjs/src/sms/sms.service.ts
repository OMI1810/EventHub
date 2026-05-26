import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Injectable()
export class SmsService {
	private apiKey: string
	private apiUrl: string

	constructor(private configService: ConfigService) {
		this.apiKey = this.configService.get<string>('INFOBIP_API_KEY')
		this.apiUrl = this.configService.get<string>('INFOBIP_API_URL')
	}

	// 📩 ОТПРАВКА SMS
	async sendSms(to: string, text: string) {
		const response = await axios.post(
			`${this.apiUrl}/sms/2/text/advanced`,
			{
				messages: [
					{
						destinations: [{ to }],
						from: 'ServiceSMS',
						text
					}
				]
			},
			{
				headers: {
					Authorization: `App ${this.apiKey}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		)
		return response.data
	}

	async sendWhatsApp(to: string, body: string) {
		const response = await axios.post(
			`${this.apiUrl}/whatsapp/1/message/template`,
			{
				messages: [
					{
						from: this.configService.get<string>('INFOBIP_WHATSAPP_NUMBER'),
						to,
						messageId: this.generateMessageId(),
						content: {
							templateName: 'test_whatsapp_template_en',
							templateData: {
								body: {
									placeholders: [body]
								}
							},
							language: 'en'
						}
					}
				]
			},
			{
				headers: {
					Authorization: `App ${this.apiKey}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		)
		return response.data
	}

	private generateMessageId(): string {
		return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`
	}
}
