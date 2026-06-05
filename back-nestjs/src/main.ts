import { RequestMethod } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const frontendUrls = (
		process.env.FRONTEND_URLS ||
		process.env.FRONTEND_URL ||
		'http://localhost:3000'
	)
		.split(',')
		.map(url => url.trim())
		.filter(Boolean)
	const port = Number(process.env.PORT || 4200)

	app.setGlobalPrefix('api', {
		exclude: [
			{ path: 'verify-email', method: RequestMethod.GET }
		]
	})

	app.use(cookieParser())
	app.enableCors({
		origin: frontendUrls,
		credentials: true,
		exposedHeaders: 'set-cookie'
	})

	await app.listen(port)
}
bootstrap()
