import { RegisterDto } from '@/auth/dto/auth.dto'
import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Role, type User } from '@prisma/client'
import { hash } from 'argon2'

import { PrismaService } from 'src/prisma.service'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async getUsers() {
		return this.prisma.user.findMany({
			select: {
				idUser: true,
				email: true,
				name: true,
				surname: true,
				patronymic: true,
				phone: true,
				role: true,
				password: false
			}
		})
	}

	async getById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				idUser: id
			}
		})
	}

	async getByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: {
				email
			}
		})
	}

	async create(dto: RegisterDto) {
		const password = await hash(dto.password)
		const phone = this.optionalString(dto.phone)
		const contact = this.optionalString(dto.contact)

		if (dto.role === Role.ORGANIZATOR) {
			return this.prisma.$transaction(async prisma => {
				const user = await prisma.user.create({
					data: {
						email: dto.email,
						phone,
						contact,
						password,
						role: dto.role
					}
				})

				const organization = await prisma.organization.create({
					data: {
						name: dto.organizationName!.trim(),
						description: this.optionalString(dto.organizationDescription),
						address: dto.organizationAddress!.trim(),
						ownerUserId: user.idUser
					}
				})

				await prisma.userOrganization.create({
					data: {
						userId: user.idUser,
						organizationId: organization.idOrganization
					}
				})

				return user
			})
		}

		return this.prisma.user.create({
			data: {
				email: dto.email,
				phone,
				contact,
				surname: this.optionalString(dto.surname),
				name: this.optionalString(dto.name),
				patronymic: this.optionalString(dto.patronymic),
				password,
				role: dto.role ?? Role.USER
			}
		})
	}

	async update(id: string, data: Partial<User>) {
		return this.prisma.user.update({
			where: {
				idUser: id
			},
			data
		})
	}

	async updateProfile(userId: string, dto: UpdateUserProfileDto) {
		await this.requireRegularUser(userId)

		await this.prisma.user.update({
			where: {
				idUser: userId
			},
			data: {
				name: this.optionalString(dto.name) ?? null,
				surname: this.optionalString(dto.surname) ?? null,
				patronymic: this.optionalString(dto.patronymic) ?? null,
				phone: this.optionalString(dto.phone) ?? null,
				contact: this.optionalString(dto.contact) ?? null
			}
		})

		return this.getById(userId)
	}

	async deleteProfile(userId: string) {
		await this.requireRegularUser(userId)

		const captionTeamIds = (
			await this.prisma.team.findMany({
				where: {
					captionId: userId
				},
				select: {
					idTeam: true
				}
			})
		).map(team => team.idTeam)

		await this.prisma.$transaction(async prisma => {
			if (captionTeamIds.length) {
				await prisma.teamJoinRequest.deleteMany({
					where: {
						teamId: {
							in: captionTeamIds
						}
					}
				})

				await prisma.userTeam.deleteMany({
					where: {
						teamId: {
							in: captionTeamIds
						}
					}
				})

				await prisma.solution.deleteMany({
					where: {
						teamId: {
							in: captionTeamIds
						}
					}
				})

				await prisma.result.deleteMany({
					where: {
						teamId: {
							in: captionTeamIds
						}
					}
				})

				await prisma.team.deleteMany({
					where: {
						idTeam: {
							in: captionTeamIds
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

	private optionalString(value?: string) {
		const normalized = value?.trim()
		return normalized ? normalized : undefined
	}

	private async requireRegularUser(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				idUser: userId
			},
			select: {
				idUser: true,
				role: true
			}
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		if (user.role !== Role.USER) {
			throw new ForbiddenException(
				'Этот профильный раздел доступен только обычным пользователям'
			)
		}

		return user
	}
}
