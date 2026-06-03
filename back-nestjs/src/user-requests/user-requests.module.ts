import { InvitesModule } from '@/invites/invites.module'
import { PrismaService } from '@/prisma.service'
import { TeamInviteService } from '@/user-teams/team-invite.service'
import { Module } from '@nestjs/common'
import { UserRequestsController } from './user-requests.controller'
import { UserRequestsService } from './user-requests.service'

@Module({
	imports: [InvitesModule],
	controllers: [UserRequestsController],
	providers: [UserRequestsService, TeamInviteService, PrismaService]
})
export class UserRequestsModule {}
