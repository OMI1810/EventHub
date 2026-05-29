import { IsOptional, IsString } from 'class-validator'

export class UpdateUserProfileDto {
	@IsOptional()
	@IsString()
	name?: string

	@IsOptional()
	@IsString()
	surname?: string

	@IsOptional()
	@IsString()
	patronymic?: string

	@IsOptional()
	@IsString()
	phone?: string

	@IsOptional()
	@IsString()
	contact?: string
}
