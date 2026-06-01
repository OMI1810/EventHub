import { Module } from '@nestjs/common'
import { InviteCoreService } from './invite-core.service'

@Module({
	providers: [InviteCoreService],
	exports: [InviteCoreService]
})
export class InvitesModule {}
