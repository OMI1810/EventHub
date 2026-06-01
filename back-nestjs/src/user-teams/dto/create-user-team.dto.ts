import { TeamFormat } from '@prisma/client'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateUserTeamDto {
	@IsString()
	@MaxLength(100)
	name: string

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string

	@IsOptional()
	@IsEnum(TeamFormat)
	format?: TeamFormat
}
