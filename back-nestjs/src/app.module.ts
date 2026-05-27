import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { GeocodingModule } from "./geocoding/geocoding.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    EventsModule,
    GeocodingModule,
    UserModule,
  ],
})
export class AppModule {}
