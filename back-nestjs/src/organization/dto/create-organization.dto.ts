import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateOrganizationDto {
	@IsNotEmpty()
	@IsString()
	name: string

	@IsOptional()
	@IsString()
	description?: string

	@IsNotEmpty()
	@IsString()
	address: string

	@IsOptional()
	@IsNumber()
	cordinatX?: number

	@IsOptional()
	@IsNumber()
	cordinatY?: number
}
