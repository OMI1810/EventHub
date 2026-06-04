import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { GeocodingModule } from "./geocoding/geocoding.module";
import { OrganizationModule } from './organization/organization.module'
import { PublicEventsModule } from './public-events/public-events.module'
import { TurniketModule } from './turniket/turniket.module'
import { UserEventsModule } from './user-events/user-events.module'
import { UserRequestsModule } from './user-requests/user-requests.module'
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
    PublicEventsModule,
    TurniketModule,
    UserEventsModule,
    UserRequestsModule,
    UserTeamsModule,
    UserModule,
  ],
})
export class AppModule {}
