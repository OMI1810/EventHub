import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { GeocodingModule } from "./geocoding/geocoding.module";
import { OrganizationModule } from './organization/organization.module'
import { UserEventsModule } from './user-events/user-events.module'
import { UserTeamsModule } from './user-teams/user-teams.module'
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AdminModule,
    AuthModule,
    EventsModule,
    GeocodingModule,
    OrganizationModule,
    UserEventsModule,
    UserTeamsModule,
    UserModule,
  ],
})
export class AppModule {}
