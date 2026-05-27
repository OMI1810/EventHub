import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Patch,
	Param,
	Post,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
import { OrganizationService } from './organization.service'

@Controller('organization')
export class OrganizationController {
	constructor(private readonly organizationService: OrganizationService) {}

	@Auth()
	@Get('me')
	async getMyOrganization(@CurrentUser('idUser') ownerId: string) {
		return this.organizationService.getMyOrganization(ownerId)
	}

	@Auth()
	@Get('me/admins')
	async getMyOrganizationAdmins(@CurrentUser('idUser') ownerId: string) {
		return this.organizationService.getMyOrganizationAdmins(ownerId)
	}

	@Auth()
	@Get('me/join-requests')
	async getMyOrganizationJoinRequests(@CurrentUser('idUser') ownerId: string) {
		return this.organizationService.getMyOrganizationJoinRequests(ownerId)
	}

	@Auth()
	@HttpCode(200)
	@Post('me/invite')
	async createInviteForMyOrganization(@CurrentUser('idUser') ownerId: string) {
		return this.organizationService.createInviteForMyOrganization(ownerId)
	}

	@Auth()
	@HttpCode(200)
	@Post('me/join-requests/:requestId/approve')
	async approveMyOrganizationJoinRequest(
		@CurrentUser('idUser') ownerId: string,
		@Param('requestId') requestId: string
	) {
		return this.organizationService.approveMyOrganizationJoinRequest(
			ownerId,
			requestId
		)
	}

	@Auth()
	@HttpCode(200)
	@Post('me/join-requests/:requestId/reject')
	async rejectMyOrganizationJoinRequest(
		@CurrentUser('idUser') ownerId: string,
		@Param('requestId') requestId: string
	) {
		return this.organizationService.rejectMyOrganizationJoinRequest(
			ownerId,
			requestId
		)
	}

	@Auth()
	@HttpCode(200)
	@Delete('me/admins/:adminId')
	async removeAdminFromMyOrganization(
		@CurrentUser('idUser') ownerId: string,
		@Param('adminId') adminId: string
	) {
		return this.organizationService.removeAdminFromMyOrganization(
			ownerId,
			adminId
		)
	}

	@Auth()
	@HttpCode(200)
	@Delete('me')
	async deleteMyOrganizationAccount(@CurrentUser('idUser') ownerId: string) {
		return this.organizationService.deleteMyOrganizationAccount(ownerId)
	}

	@Auth()
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Patch('me')
	async updateMyOrganization(
		@CurrentUser('idUser') ownerId: string,
		@Body() dto: UpdateOrganizationDto
	) {
		return this.organizationService.updateMyOrganization(ownerId, dto)
	}
}
