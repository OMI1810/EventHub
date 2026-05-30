import { PrismaService } from "@/prisma.service";
import { Module } from "@nestjs/common";
import { EventInviteService } from "./event-invite.service";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventInviteService, PrismaService],
})
export class EventsModule {}
