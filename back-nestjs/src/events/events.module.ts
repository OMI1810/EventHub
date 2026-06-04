import { PrismaService } from "@/prisma.service";
import { UserService } from "@/user/user.service";
import { InvitesModule } from "@/invites/invites.module";
import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  imports: [InvitesModule],
  controllers: [EventsController],
  providers: [EventsService, PrismaService, UserService],
})
export class EventsModule {}
