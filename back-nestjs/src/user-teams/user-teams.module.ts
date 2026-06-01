import { InvitesModule } from '@/invites/invites.module'
import { PrismaService } from '@/prisma.service'
import { Module } from '@nestjs/common'
import { TeamInviteService } from './team-invite.service'
import { UserTeamsController } from './user-teams.controller'
import { UserTeamsService } from './user-teams.service'

@Module({
	imports: [InvitesModule],
	controllers: [UserTeamsController],
	providers: [UserTeamsService, TeamInviteService, PrismaService]
})
export class UserTeamsModule {}
