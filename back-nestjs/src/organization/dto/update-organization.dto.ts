import { IsOptional, IsString } from 'class-validator'

export class UpdateOrganizationDto {
	@IsOptional()
	@IsString()
	phone?: string

	@IsOptional()
	@IsString()
	contact?: string

	@IsOptional()
	@IsString()
	name?: string

	@IsOptional()
	@IsString()
	description?: string

	@IsOptional()
	@IsString()
	address?: string
}
