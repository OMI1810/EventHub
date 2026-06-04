import { OrganizationModule } from '@/organization/organization.module'
import { PrismaService } from '@/prisma.service'
import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { UserModule } from '@/user/user.module'

@Module({
	imports: [OrganizationModule, UserModule],
	controllers: [AdminController],
	providers: [AdminService, PrismaService]
})
export class AdminModule {}
