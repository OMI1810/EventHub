import { PrismaService } from '@/prisma.service'
import { Module } from '@nestjs/common'
import { UserEventsController } from './user-events.controller'
import { UserEventsService } from './user-events.service'

@Module({
	controllers: [UserEventsController],
	providers: [UserEventsService, PrismaService]
})
export class UserEventsModule {}
