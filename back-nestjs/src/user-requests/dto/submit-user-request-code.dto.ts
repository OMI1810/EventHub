import { IsNotEmpty, IsString } from 'class-validator'

export class SubmitUserRequestCodeDto {
	@IsString()
	@IsNotEmpty()
	code: string
}
