import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { GeocodingModule } from "./geocoding/geocoding.module";
import { OrganizationModule } from './organization/organization.module'
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
    UserModule,
  ],
})
export class AppModule {}
