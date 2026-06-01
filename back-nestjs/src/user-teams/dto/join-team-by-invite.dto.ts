import { IsString } from 'class-validator'

export class JoinTeamByInviteDto {
	@IsString()
	code: string

	@IsString()
	eventId: string
}
