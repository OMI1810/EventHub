import { PrismaService } from '@/prisma.service'
import { Module } from '@nestjs/common'
import { PassModule } from '@/pass/pass.module'
import { UserEventsController } from './user-events.controller'
import { UserEventsService } from './user-events.service'

@Module({
	imports: [PassModule],
	controllers: [UserEventsController],
	providers: [UserEventsService, PrismaService]
})
export class UserEventsModule {}
