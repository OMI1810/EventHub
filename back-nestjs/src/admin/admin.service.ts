import { OrganizationInviteService } from '@/organization/organization-invite.service'
import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Role, StatusJoinRequest } from '@prisma/client'
import { CreateAdminOrganizationRequestDto } from './dto/create-admin-organization-request.dto'
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto'

@Injectable()
export class AdminService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly organizationInviteService: OrganizationInviteService
	) {}

	async getProfile(userId: string) {
		const user = await this.requireAdmin(userId)

		return {
			idUser: user.idUser,
			name: user.name,
			surname: user.surname,
			patronymic: user.patronymic,
			email: user.email,
			phone: user.phone,
			contact: user.contact,
			role: user.role,
			verificationToken: user.verificationToken
		}
	}

	async updateProfile(userId: string, dto: UpdateAdminProfileDto) {
		await this.requireAdmin(userId)

		await this.prisma.user.update({
			where: {
				idUser: userId
			},
			data: {
				name: this.optionalString(dto.name),
				surname: this.optionalString(dto.surname),
				patronymic: this.optionalString(dto.patronymic),
				phone: this.optionalString(dto.phone),
				contact: this.optionalString(dto.contact)
			}
		})

		return this.getProfile(userId)
	}

	async deleteProfile(userId: string) {
		await this.requireAdmin(userId)

		const eventIds = (
			await this.prisma.event.findMany({
				where: {
					userId
				},
				select: {
					idEvent: true
				}
			})
		).map(event => event.idEvent)

		const caseIds = eventIds.length
			? (
					await this.prisma.case.findMany({
						where: {
							eventId: {
								in: eventIds
							}
						},
						select: {
							idCase: true
						}
					})
			  ).map(item => item.idCase)
			: []

		const teamIds = eventIds.length
			? (
					await this.prisma.team.findMany({
						where: {
							eventId: {
								in: eventIds
							}
						},
						select: {
							idTeam: true
						}
					})
			  ).map(item => item.idTeam)
			: []

		await this.prisma.$transaction(async prisma => {
			if (teamIds.length) {
				await prisma.teamJoinRequest.deleteMany({
					where: {
						teamId: {
							in: teamIds
						}
					}
				})

				await prisma.userTeam.deleteMany({
					where: {
						teamId: {
							in: teamIds
						}
					}
				})
			}

			if (eventIds.length) {
				await prisma.solution.deleteMany({
					where: {
						eventId: {
							in: eventIds
						}
					}
				})

				await prisma.result.deleteMany({
					where: {
						eventId: {
							in: eventIds
						}
					}
				})

				await prisma.material.deleteMany({
					where: {
						eventId: {
							in: eventIds
						}
					}
				})

				await prisma.eventTag.deleteMany({
					where: {
						eventId: {
							in: eventIds
						}
					}
				})
			}

			if (teamIds.length) {
				await prisma.team.deleteMany({
					where: {
						idTeam: {
							in: teamIds
						}
					}
				})
			}

			if (caseIds.length) {
				await prisma.case.deleteMany({
					where: {
						idCase: {
							in: caseIds
						}
					}
				})
			}

			if (eventIds.length) {
				await prisma.event.deleteMany({
					where: {
						idEvent: {
							in: eventIds
						}
					}
				})
			}

			await prisma.organizationJoinRequest.deleteMany({
				where: {
					userId
				}
			})

			await prisma.userOrganization.deleteMany({
				where: {
					userId
				}
			})

			await prisma.teamJoinRequest.deleteMany({
				where: {
					userId
				}
			})

			await prisma.userTeam.deleteMany({
				where: {
					userId
				}
			})

			await prisma.solution.deleteMany({
				where: {
					userId
				}
			})

			await prisma.result.deleteMany({
				where: {
					userId
				}
			})

			await prisma.tag.deleteMany({
				where: {
					userId
				}
			})

			await prisma.user.delete({
				where: {
					idUser: userId
				}
			})
		})

		return { success: true }
	}

	async getOrganizations(userId: string) {
		await this.requireAdmin(userId)

		const relations = await this.prisma.userOrganization.findMany({
			where: {
				userId
			},
			select: {
				organization: {
					select: {
						idOrganization: true,
						name: true,
						description: true,
						address: true,
						cordinatX: true,
						cordinatY: true,
						owner: {
							select: {
								idUser: true,
								email: true,
								contact: true
							}
						}
					}
				}
			},
			orderBy: {
				organization: {
					name: 'asc'
				}
			}
		})

		return relations.map(({ organization }) => organization)
	}

	async getOrganizationRequests(userId: string) {
		await this.requireAdmin(userId)

		return this.prisma.organizationJoinRequest.findMany({
			where: {
				userId,
				status: StatusJoinRequest.PENDING
			},
			select: {
				idJoinTeam: true,
				status: true,
				organization: {
					select: {
						idOrganization: true,
						name: true,
						description: true,
						address: true,
						cordinatX: true,
						cordinatY: true,
						owner: {
							select: {
								idUser: true,
								email: true,
								contact: true
							}
						}
					}
				}
			},
			orderBy: {
				organization: {
					name: 'asc'
				}
			}
		})
	}

	async createOrganizationRequest(
		userId: string,
		dto: CreateAdminOrganizationRequestDto
	) {
		const user = await this.requireAdmin(userId)

		if (user.verificationToken) {
			throw new ForbiddenException(
				'Подтвердите почту перед отправкой заявки в организацию'
			)
		}

		const invite =
			await this.organizationInviteService.findActiveInviteByCode(dto.code)

		if (!invite) {
			throw new BadRequestException(
				'Код приглашения недействителен или срок его действия истек'
			)
		}

		const [organizationRelation, existingRequest] = await Promise.all([
			this.prisma.userOrganization.findUnique({
				where: {
					userId_organizationId: {
						userId,
						organizationId: invite.organizationId
					}
				}
			}),
			this.prisma.organizationJoinRequest.findUnique({
				where: {
					userId_organizationId: {
						userId,
						organizationId: invite.organizationId
					}
				}
			})
		])

		if (organizationRelation) {
			throw new BadRequestException('Вы уже состоите в этой организации')
		}

		if (existingRequest?.status === StatusJoinRequest.PENDING) {
			throw new BadRequestException('Заявка в эту организацию уже отправлена')
		}

		if (existingRequest) {
			await this.prisma.organizationJoinRequest.update({
				where: {
					idJoinTeam: existingRequest.idJoinTeam
				},
				data: {
					status: StatusJoinRequest.PENDING
				}
			})
		} else {
			await this.prisma.organizationJoinRequest.create({
				data: {
					organizationId: invite.organizationId,
					userId,
					status: StatusJoinRequest.PENDING
				}
			})
		}

		return { success: true }
	}

	async cancelOrganizationRequest(userId: string, requestId: string) {
		await this.requireAdmin(userId)

		const request = await this.prisma.organizationJoinRequest.findFirst({
			where: {
				idJoinTeam: requestId,
				userId
			},
			select: {
				idJoinTeam: true,
				status: true
			}
		})

		if (!request) {
			throw new NotFoundException('Заявка не найдена')
		}

		if (request.status !== StatusJoinRequest.PENDING) {
			throw new BadRequestException(
				'Можно отменить только ожидающую заявку на вступление'
			)
		}

		await this.prisma.organizationJoinRequest.update({
			where: {
				idJoinTeam: request.idJoinTeam
			},
			data: {
				status: StatusJoinRequest.CANCELED
			}
		})

		return { success: true }
	}

	private async requireAdmin(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				idUser: userId
			},
			select: {
				idUser: true,
				name: true,
				surname: true,
				patronymic: true,
				email: true,
				phone: true,
				contact: true,
				role: true,
				verificationToken: true
			}
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		if (user.role !== Role.ADMIN) {
			throw new ForbiddenException(
				'Панель администратора доступна только администраторам'
			)
		}

		return user
	}

	private optionalString(value?: string) {
		const normalized = value?.trim()
		return normalized ? normalized : null
	}
}
