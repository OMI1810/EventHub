import { PassService } from '@/pass/pass.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TurniketService {
	constructor(private readonly passService: PassService) {}

	verifyAndConsume(turniketUserId: string, token: string, turniketDeviceId?: string) {
		return this.passService.verifyAndConsume(
			turniketUserId,
			token,
			turniketDeviceId
		)
	}
}
