import { IsNotEmpty, IsString } from 'class-validator'

export class RevokeUserEventPassDto {
	@IsString()
	@IsNotEmpty()
	token: string
}
