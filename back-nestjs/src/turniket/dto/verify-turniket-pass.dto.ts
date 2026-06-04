import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class VerifyTurniketPassDto {
	@IsString()
	@IsNotEmpty()
	token: string

	@IsOptional()
	@IsString()
	turniketDeviceId?: string
}
