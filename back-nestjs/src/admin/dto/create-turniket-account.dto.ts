import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CreateTurniketAccountDto {
	@IsEmail()
	email: string

	@IsString()
	@MinLength(6)
	password: string

	@IsString()
	@IsNotEmpty()
	name: string
}
