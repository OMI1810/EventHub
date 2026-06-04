import { Module } from '@nestjs/common'
import { PassModule } from '@/pass/pass.module'
import { TurniketController } from './turniket.controller'
import { TurniketService } from './turniket.service'

@Module({
	imports: [PassModule],
	controllers: [TurniketController],
	providers: [TurniketService]
})
export class TurniketModule {}
