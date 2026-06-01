import { InvitesModule } from '@/invites/invites.module'
import { PrismaService } from '@/prisma.service'
import { Module } from '@nestjs/common'
import { OrganizationController } from './organization.controller'
import { OrganizationInviteService } from './organization-invite.service'
import { OrganizationService } from './organization.service'

@Module({
	imports: [InvitesModule],
	controllers: [OrganizationController],
	providers: [OrganizationInviteService, OrganizationService, PrismaService],
	exports: [OrganizationInviteService]
})
export class OrganizationModule {}
