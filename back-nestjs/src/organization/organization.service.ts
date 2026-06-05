import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Role, StatusJoinRequest } from '@prisma/client'
import { OrganizationInviteService } from './organization-invite.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'

interface OrganizationEventsPaginationInput {
	limit?: string
	offset?: string
}

@Injectable()
export class OrganizationService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly organizationInviteService: OrganizationInviteService
	) {}

	async getMyOrganization(ownerId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		return organization
	}

	async createMyOrganization(ownerId: string, dto: CreateOrganizationDto) {
		const user = await this.requireVerifiedOrganizationOwner(ownerId)
		const existingOrganization = await this.getOrganizationByOwnerId(ownerId)

		if (existingOrganization) {
			throw new BadRequestException('Организация уже создана')
		}

		const organization = await this.prisma.$transaction(async prisma => {
			const createdOrganization = await prisma.organization.create({
				data: {
					name: dto.name.trim(),
					description: this.optionalString(dto.description),
					address: dto.address.trim(),
					cordinatX: dto.cordinatX,
					cordinatY: dto.cordinatY,
					ownerUserId: user.idUser
				}
			})

			await prisma.userOrganization.create({
				data: {
					userId: user.idUser,
					organizationId: createdOrganization.idOrganization
				}
			})

			return createdOrganization
		})

		return this.getMyOrganization(organization.ownerUserId)
	}

	async updateMyOrganization(ownerId: string, dto: UpdateOrganizationDto) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const phone = this.optionalString(dto.phone)
		const contact = this.optionalString(dto.contact)
		const name = this.optionalString(dto.name)
		const description = this.optionalString(dto.description)
		const address = this.optionalString(dto.address)
		const shouldResetCoordinates =
			dto.address !== undefined &&
			(dto.cordinatX === undefined || dto.cordinatY === undefined)

		await this.prisma.$transaction(async prisma => {
			await prisma.user.update({
				where: {
					idUser: ownerId
				},
				data: {
					phone,
					contact
				}
			})

			await prisma.organization.update({
				where: {
					idOrganization: organization.idOrganization
				},
				data: {
					name,
					description,
					address,
					cordinatX: shouldResetCoordinates ? null : dto.cordinatX,
					cordinatY: shouldResetCoordinates ? null : dto.cordinatY
				}
			})
		})

		return this.getMyOrganization(ownerId)
	}

	async getMyOrganizationAdmins(ownerId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const admins = await this.prisma.userOrganization.findMany({
			where: {
				organizationId: organization.idOrganization,
				user: {
					role: Role.ADMIN
				}
			},
			select: {
				user: {
					select: {
						idUser: true,
						surname: true,
						name: true,
						patronymic: true,
						email: true,
						phone: true,
						contact: true,
						role: true
					}
				}
			},
			orderBy: {
				user: {
					surname: 'asc'
				}
			}
		})

		return admins.map(({ user }) => user)
	}

	async getMyOrganizationEvents(
		ownerId: string,
		pagination?: OrganizationEventsPaginationInput
	) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const shouldPaginate = pagination?.limit !== undefined
		const limit = shouldPaginate
			? this.normalizeEventsLimit(pagination?.limit)
			: undefined
		const offset = shouldPaginate
			? this.normalizeEventsOffset(pagination?.offset)
			: 0

		const events = await this.prisma.event.findMany({
			where: {
				organizationId: organization.idOrganization
			},
			select: {
				idEvent: true,
				title: true,
				description: true,
				type: true,
				format: true,
				status: true,
				dataStart: true,
				dataEnd: true,
				hasTeams: true,
				hasCases: true,
				hasLoadedSolution: true,
				hasMaterials: true,
				hasResualt: true,
				_count: {
					select: {
						participant: true,
						teams: true
					}
				}
			},
			orderBy: [{ dataStart: 'desc' }, { title: 'asc' }],
			...(shouldPaginate
				? {
						take: limit! + 1,
						skip: offset
				  }
				: {})
		})

		const visibleEvents = shouldPaginate ? events.slice(0, limit) : events
		const items = visibleEvents.map(event => ({
			idEvent: event.idEvent,
			title: event.title,
			description: event.description,
			type: event.type,
			format: event.format,
			status: event.status,
			dataStart: event.dataStart,
			dataEnd: event.dataEnd,
			hasTeams: event.hasTeams,
			hasCases: event.hasCases,
			hasLoadedSolution: event.hasLoadedSolution,
			hasMaterials: event.hasMaterials,
			hasResualt: event.hasResualt,
			participantsCount: event._count.participant,
			teamsCount: event._count.teams
		}))

		if (!shouldPaginate) {
			return items
		}

		const hasMore = events.length > limit!

		return {
			items,
			limit,
			offset,
			nextOffset: hasMore ? offset + limit! : null,
			hasMore
		}
	}

	async removeAdminFromMyOrganization(ownerId: string, adminId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const adminRelation = await this.prisma.userOrganization.findUnique({
			where: {
				userId_organizationId: {
					userId: adminId,
					organizationId: organization.idOrganization
				}
			},
			select: {
				userId: true,
				user: {
					select: {
						role: true
					}
				}
			}
		})

		if (!adminRelation || adminRelation.user.role !== Role.ADMIN) {
			throw new NotFoundException('Связь администратора с организацией не найдена')
		}

		await this.prisma.userOrganization.delete({
			where: {
				userId_organizationId: {
					userId: adminId,
					organizationId: organization.idOrganization
				}
			}
		})

		return { success: true }
	}

	async createInviteForMyOrganization(ownerId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		return this.organizationInviteService.createOrganizationInvite(
			organization.idOrganization,
			ownerId
		)
	}

	async deleteMyOrganizationAccount(ownerId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const eventIds = (
			await this.prisma.event.findMany({
				where: {
					organizationId: organization.idOrganization
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
					OR: [
						{
							organizationId: organization.idOrganization
						},
						{
							userId: ownerId
						}
					]
				}
			})

			await prisma.userOrganization.deleteMany({
				where: {
					OR: [
						{
							organizationId: organization.idOrganization
						},
						{
							userId: ownerId
						}
					]
				}
			})

			await prisma.teamJoinRequest.deleteMany({
				where: {
					userId: ownerId
				}
			})

			await prisma.userTeam.deleteMany({
				where: {
					userId: ownerId
				}
			})

			await prisma.solution.deleteMany({
				where: {
					userId: ownerId
				}
			})

			await prisma.result.deleteMany({
				where: {
					userId: ownerId
				}
			})

			await prisma.tag.deleteMany({
				where: {
					userId: ownerId
				}
			})

			await prisma.organization.delete({
				where: {
					idOrganization: organization.idOrganization
				}
			})

			await prisma.user.delete({
				where: {
					idUser: ownerId
				}
			})
		})

		return { success: true }
	}

	async getMyOrganizationJoinRequests(ownerId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const joinRequests = await this.prisma.organizationJoinRequest.findMany({
			where: {
				organizationId: organization.idOrganization,
				status: StatusJoinRequest.PENDING
			},
			select: {
				idJoinTeam: true,
				status: true,
				user: {
					select: {
						idUser: true,
						surname: true,
						name: true,
						patronymic: true,
						email: true,
						phone: true,
						contact: true,
						role: true
					}
				}
			},
			orderBy: {
				user: {
					surname: 'asc'
				}
			}
		})

		return joinRequests
	}

	async approveMyOrganizationJoinRequest(
		ownerId: string,
		requestId: string
	) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const joinRequest = await this.prisma.organizationJoinRequest.findFirst({
			where: {
				idJoinTeam: requestId,
				organizationId: organization.idOrganization,
				status: StatusJoinRequest.PENDING
			},
			select: {
				idJoinTeam: true,
				organizationId: true,
				userId: true,
				user: {
					select: {
						role: true,
						verificationToken: true
					}
				}
			}
		})

		if (!joinRequest) {
			throw new NotFoundException('Заявка на вступление не найдена')
		}

		if (joinRequest.user.role !== Role.ADMIN) {
			throw new BadRequestException(
				'Только аккаунты администраторов могут вступать в организацию как администраторы'
			)
		}

		if (joinRequest.user.verificationToken) {
			throw new BadRequestException(
				'Администратор должен подтвердить почту перед добавлением в организацию'
			)
		}

		const existingRelation = await this.prisma.userOrganization.findUnique({
			where: {
				userId_organizationId: {
					userId: joinRequest.userId,
					organizationId: joinRequest.organizationId
				}
			}
		})

		if (existingRelation) {
			throw new BadRequestException(
				'Администратор уже связан с этой организацией'
			)
		}

		await this.prisma.$transaction(async prisma => {
			await prisma.userOrganization.create({
				data: {
					userId: joinRequest.userId,
					organizationId: joinRequest.organizationId
				}
			})

			await prisma.organizationJoinRequest.update({
				where: {
					idJoinTeam: joinRequest.idJoinTeam
				},
				data: {
					status: StatusJoinRequest.ACCEPT
				}
			})
		})

		return { success: true }
	}

	async rejectMyOrganizationJoinRequest(ownerId: string, requestId: string) {
		const organization = await this.getOrganizationByOwnerId(ownerId)

		if (!organization) {
			throw new ForbiddenException(
				'Панель организации доступна только владельцу организации'
			)
		}

		const joinRequest = await this.prisma.organizationJoinRequest.findFirst({
			where: {
				idJoinTeam: requestId,
				organizationId: organization.idOrganization,
				status: StatusJoinRequest.PENDING
			},
			select: {
				idJoinTeam: true
			}
		})

		if (!joinRequest) {
			throw new NotFoundException('Заявка на вступление не найдена')
		}

		await this.prisma.organizationJoinRequest.update({
			where: {
				idJoinTeam: joinRequest.idJoinTeam
			},
			data: {
				status: StatusJoinRequest.REJECTED
			}
		})

		return { success: true }
	}

	private async getOrganizationByOwnerId(ownerId: string) {
		return this.prisma.organization.findFirst({
			where: {
				ownerUserId: ownerId
			},
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
						phone: true,
						contact: true,
						role: true
					}
				}
			}
		})
	}

	private async requireVerifiedOrganizationOwner(ownerId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				idUser: ownerId
			},
			select: {
				idUser: true,
				role: true,
				verificationToken: true
			}
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		if (user.role !== Role.ORGANIZATOR) {
			throw new ForbiddenException(
				'Создать организацию может только создатель организации'
			)
		}

		if (user.verificationToken) {
			throw new ForbiddenException(
				'Подтвердите почту перед созданием организации'
			)
		}

		return user
	}

	private optionalString(value?: string) {
		const normalized = value?.trim()
		return normalized ? normalized : null
	}

	private normalizeEventsLimit(value?: string) {
		const parsed = Number(value)

		if (!Number.isInteger(parsed) || parsed <= 0) {
			return 30
		}

		return Math.min(parsed, 50)
	}

	private normalizeEventsOffset(value?: string) {
		const parsed = Number(value)

		if (!Number.isInteger(parsed) || parsed < 0) {
			return 0
		}

		return parsed
	}
}
