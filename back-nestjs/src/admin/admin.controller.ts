import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Patch,
	Post,
	Param,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { CreateTurniketAccountDto } from './dto/create-turniket-account.dto'
import { CreateAdminOrganizationRequestDto } from './dto/create-admin-organization-request.dto'
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto'

@Controller('admin')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Auth()
	@Get('profile')
	async getProfile(@CurrentUser('idUser') userId: string) {
		return this.adminService.getProfile(userId)
	}

	@Auth()
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Patch('profile')
	async updateProfile(
		@CurrentUser('idUser') userId: string,
		@Body() dto: UpdateAdminProfileDto
	) {
		return this.adminService.updateProfile(userId, dto)
	}

	@Auth()
	@HttpCode(200)
	@Delete('profile')
	async deleteProfile(@CurrentUser('idUser') userId: string) {
		return this.adminService.deleteProfile(userId)
	}

	@Auth()
	@Get('organizations')
	async getOrganizations(@CurrentUser('idUser') userId: string) {
		return this.adminService.getOrganizations(userId)
	}

	@Auth()
	@Get('organization-requests')
	async getOrganizationRequests(@CurrentUser('idUser') userId: string) {
		return this.adminService.getOrganizationRequests(userId)
	}

	@Auth()
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('organization-requests')
	async createOrganizationRequest(
		@CurrentUser('idUser') userId: string,
		@Body() dto: CreateAdminOrganizationRequestDto
	) {
		return this.adminService.createOrganizationRequest(userId, dto)
	}

	@Auth()
	@HttpCode(200)
	@Post('organization-requests/:requestId/cancel')
	async cancelOrganizationRequest(
		@CurrentUser('idUser') userId: string,
		@Param('requestId') requestId: string
	) {
		return this.adminService.cancelOrganizationRequest(userId, requestId)
	}

	@Auth()
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('turnikets')
	async createTurniketAccount(
		@CurrentUser('idUser') userId: string,
		@Body() dto: CreateTurniketAccountDto
	) {
		return this.adminService.createTurniketAccount(userId, dto)
	}
}
