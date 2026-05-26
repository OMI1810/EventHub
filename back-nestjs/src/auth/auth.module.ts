import { EmailModule } from '@/email/email.module'
import { PrismaService } from '@/prisma.service'
import { SmsModule } from '@/sms/sms.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { getJwtConfig } from 'src/config/jwt.config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RefreshTokenService } from './refresh-token.service'
import { SmsAuthController } from './sms/sms-auth.controller'
import { SmsAuthService } from './sms/sms-auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig
		}),
		UserModule,
		EmailModule,
		SmsModule
	],
	controllers: [AuthController, SmsAuthController],
	providers: [
		JwtStrategy,
		PrismaService,
		AuthService,
		RefreshTokenService,
		SmsAuthService
	]
})
export class AuthModule {}
