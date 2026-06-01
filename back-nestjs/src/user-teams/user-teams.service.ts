import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { EventFormat, Role, StatusJoinRequest, TeamFormat } from '@prisma/client'
import { CreateUserTeamDto } from './dto/create-user-team.dto'
import { JoinTeamByInviteDto } from './dto/join-team-by-invite.dto'
import { UpdateUserTeamDto } from './dto/update-user-team.dto'
import { TeamInviteService } from './team-invite.service'

@Injectable()
export class UserTeamsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly teamInviteService: TeamInviteService
	) {}

	async getTeamState(userId: string, eventId: string) {
		await this.requireRegularUser(userId)

		const event = await this.prisma.event.findUnique({
			where: {
				idEvent: eventId
			},
			select: {
				idEvent: true,
				hasTeams: true,
				format: true,
				participanInTeamLimit: true,
				participant: {
					where: {
						userId
					},
					select: {
						userId: true
					}
				}
			}
		})

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		const team = await this.findUserTeamForEvent(userId, eventId)

		return {
			eventId,
			hasTeams: event.hasTeams,
			isParticipating: Boolean(event.participant.length),
			canChooseFormat: event.format === EventFormat.HYBRID,
			defaultFormat: this.resolveTeamFormatForEvent(event.format),
			teamMemberLimit: event.participanInTeamLimit,
			hasTeam: Boolean(team),
			isCaptain: team?.caption.idUser === userId,
			team: team
				? {
						idTeam: team.idTeam,
						name: team.name,
						description: team.description,
						format: team.format,
						isCaptain: team.caption.idUser === userId,
						members: team.user.map(member => ({
							idUser: member.user.idUser,
							name: member.user.name,
							surname: member.user.surname,
							patronymic: member.user.patronymic,
							email: member.user.email,
							phone: member.user.phone,
							contact: member.user.contact,
							roleInTeam: member.role
						})),
						joinRequests:
							team.caption.idUser === userId
								? team.joinRequest.map(request => ({
										idJoinTeam: request.idJoinTeam,
										status: request.status,
										user: {
											idUser: request.user.idUser,
											name: request.user.name,
											surname: request.user.surname,
											patronymic: request.user.patronymic,
											email: request.user.email,
											phone: request.user.phone,
											contact: request.user.contact
										}
								  }))
								: []
				  }
				: null
		}
	}

	async createTeam(userId: string, eventId: string, dto: CreateUserTeamDto) {
		await this.requireRegularUser(userId)
		const event = await this.requireTeamEnabledParticipation(userId, eventId)

		const existingTeam = await this.findUserTeamForEvent(userId, eventId)

		if (existingTeam) {
			throw new BadRequestException('Вы уже состоите в команде этого мероприятия')
		}

		const teamFormat = this.resolveRequestedTeamFormat(event.format, dto.format)

		try {
			await this.prisma.$transaction(async prisma => {
				const team = await prisma.team.create({
					data: {
						name: dto.name.trim(),
						description: this.optionalString(dto.description),
						format: teamFormat,
						eventId,
						captionId: userId
					},
					select: {
						idTeam: true
					}
				})

				await prisma.userTeam.create({
					data: {
						userId,
						teamId: team.idTeam,
						role: 'CAPTAIN'
					}
				})
			})
		} catch {
			throw new BadRequestException('Команда с таким названием уже существует в этом мероприятии')
		}

		return this.getTeamState(userId, eventId)
	}

	async updateTeam(userId: string, teamId: string, dto: UpdateUserTeamDto) {
		await this.requireRegularUser(userId)

		const team = await this.requireCaptainTeamAccess(userId, teamId)
		const teamFormat =
			dto.format !== undefined
				? this.resolveRequestedTeamFormat(team.event.format, dto.format)
				: undefined

		try {
			await this.prisma.team.update({
				where: {
					idTeam: teamId
				},
				data: {
					name: dto.name?.trim(),
					description:
						dto.description !== undefined
							? this.optionalString(dto.description) ?? null
							: undefined,
					format: teamFormat
				}
			})
		} catch {
			throw new BadRequestException('Команда с таким названием уже существует в этом мероприятии')
		}

		return this.getTeamState(userId, team.eventId)
	}

	async deleteTeam(userId: string, teamId: string) {
		await this.requireRegularUser(userId)
		const team = await this.requireCaptainTeamAccess(userId, teamId)

		await this.prisma.$transaction(async prisma => {
			await prisma.teamJoinRequest.deleteMany({
				where: {
					teamId
				}
			})

			await prisma.userTeam.deleteMany({
				where: {
					teamId
				}
			})

			await prisma.solution.deleteMany({
				where: {
					teamId
				}
			})

			await prisma.result.deleteMany({
				where: {
					teamId
				}
			})

			await prisma.team.delete({
				where: {
					idTeam: teamId
				}
			})
		})

		return { success: true, eventId: team.eventId }
	}

	async createTeamInvite(userId: string, teamId: string) {
		await this.requireRegularUser(userId)
		const team = await this.requireCaptainTeamAccess(userId, teamId)

		return this.teamInviteService.createTeamInvite(teamId, team.eventId, userId)
	}

	async joinByInvite(userId: string, dto: JoinTeamByInviteDto) {
		await this.requireRegularUser(userId)
		const invite = await this.teamInviteService.findActiveInviteByCode(dto.code)

		if (!invite || invite.eventId !== dto.eventId) {
			throw new BadRequestException(
				'Код приглашения недействителен или не относится к этому мероприятию'
			)
		}

		await this.requireTeamEnabledParticipation(userId, dto.eventId)

		const [existingTeam, existingPendingRequest, sameTeamRequest] = await Promise.all([
			this.findUserTeamForEvent(userId, dto.eventId),
			this.prisma.teamJoinRequest.findFirst({
				where: {
					userId,
					status: StatusJoinRequest.PENDING,
					team: {
						eventId: dto.eventId
					}
				}
			}),
			this.prisma.teamJoinRequest.findUnique({
				where: {
					userId_teamId: {
						userId,
						teamId: invite.teamId
					}
				}
			})
		])

		if (existingTeam) {
			throw new BadRequestException('Вы уже состоите в команде этого мероприятия')
		}

		if (existingPendingRequest) {
			throw new BadRequestException('У вас уже есть ожидающая заявка в команду этого мероприятия')
		}

		if (sameTeamRequest) {
			await this.prisma.teamJoinRequest.update({
				where: {
					idJoinTeam: sameTeamRequest.idJoinTeam
				},
				data: {
					status: StatusJoinRequest.PENDING
				}
			})
		} else {
			await this.prisma.teamJoinRequest.create({
				data: {
					userId,
					teamId: invite.teamId,
					status: StatusJoinRequest.PENDING
				}
			})
		}

		return this.getTeamState(userId, dto.eventId)
	}

	async approveJoinRequest(userId: string, requestId: string) {
		await this.requireRegularUser(userId)

		const request = await this.prisma.teamJoinRequest.findUnique({
			where: {
				idJoinTeam: requestId
			},
			select: {
				idJoinTeam: true,
				teamId: true,
				userId: true,
				status: true,
				team: {
					select: {
						idTeam: true,
						eventId: true,
						captionId: true,
						event: {
							select: {
								participanInTeamLimit: true
							}
						},
						_count: {
							select: {
								user: true
							}
						}
					}
				}
			}
		})

		if (!request) {
			throw new NotFoundException('Заявка в команду не найдена')
		}

		if (request.team.captionId !== userId) {
			throw new ForbiddenException('Управлять заявками команды может только капитан')
		}

		if (request.status !== StatusJoinRequest.PENDING) {
			throw new BadRequestException('Можно одобрить только ожидающую заявку')
		}

		const existingTeam = await this.findUserTeamForEvent(request.userId, request.team.eventId)

		if (existingTeam) {
			throw new BadRequestException('Пользователь уже состоит в команде этого мероприятия')
		}

		const memberLimit = request.team.event.participanInTeamLimit

		if (memberLimit && request.team._count.user >= memberLimit) {
			throw new BadRequestException('В команде уже достигнут лимит участников')
		}

		await this.prisma.$transaction(async prisma => {
			await prisma.userTeam.create({
				data: {
					userId: request.userId,
					teamId: request.teamId,
					role: 'MEMBER'
				}
			})

			await prisma.teamJoinRequest.update({
				where: {
					idJoinTeam: request.idJoinTeam
				},
				data: {
					status: StatusJoinRequest.ACCEPT
				}
			})
		})

		return this.getTeamState(userId, request.team.eventId)
	}

	async rejectJoinRequest(userId: string, requestId: string) {
		await this.requireRegularUser(userId)

		const request = await this.prisma.teamJoinRequest.findUnique({
			where: {
				idJoinTeam: requestId
			},
			select: {
				idJoinTeam: true,
				status: true,
				team: {
					select: {
						eventId: true,
						captionId: true
					}
				}
			}
		})

		if (!request) {
			throw new NotFoundException('Заявка в команду не найдена')
		}

		if (request.team.captionId !== userId) {
			throw new ForbiddenException('Управлять заявками команды может только капитан')
		}

		if (request.status !== StatusJoinRequest.PENDING) {
			throw new BadRequestException('Можно отклонить только ожидающую заявку')
		}

		await this.prisma.teamJoinRequest.update({
			where: {
				idJoinTeam: request.idJoinTeam
			},
			data: {
				status: StatusJoinRequest.REJECTED
			}
		})

		return this.getTeamState(userId, request.team.eventId)
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
			throw new ForbiddenException('Этот раздел доступен только обычным пользователям')
		}

		return user
	}

	private async requireTeamEnabledParticipation(userId: string, eventId: string) {
		const event = await this.prisma.event.findUnique({
			where: {
				idEvent: eventId
			},
			select: {
				idEvent: true,
				hasTeams: true,
				format: true,
				participant: {
					where: {
						userId
					},
					select: {
						userId: true
					}
				}
			}
		})

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		if (!event.hasTeams) {
			throw new BadRequestException('Командный режим не включён для этого мероприятия')
		}

		if (!event.participant.length) {
			throw new ForbiddenException('Сначала необходимо зарегистрироваться на мероприятие')
		}

		return event
	}

	private async requireCaptainTeamAccess(userId: string, teamId: string) {
		const team = await this.prisma.team.findUnique({
			where: {
				idTeam: teamId
			},
			select: {
				idTeam: true,
				eventId: true,
				captionId: true,
				event: {
					select: {
						format: true
					}
				}
			}
		})

		if (!team) {
			throw new NotFoundException('Команда не найдена')
		}

		if (team.captionId !== userId) {
			throw new ForbiddenException('Управлять командой может только капитан')
		}

		return team
	}

	private async findUserTeamForEvent(userId: string, eventId: string) {
		return this.prisma.team.findFirst({
			where: {
				eventId,
				user: {
					some: {
						userId
					}
				}
			},
			select: {
				idTeam: true,
				name: true,
				description: true,
				format: true,
				caption: {
					select: {
						idUser: true
					}
				},
				user: {
					select: {
						role: true,
						user: {
							select: {
								idUser: true,
								name: true,
								surname: true,
								patronymic: true,
								email: true,
								phone: true,
								contact: true
							}
						}
					}
				},
				joinRequest: {
					where: {
						status: StatusJoinRequest.PENDING
					},
					select: {
						idJoinTeam: true,
						status: true,
						user: {
							select: {
								idUser: true,
								name: true,
								surname: true,
								patronymic: true,
								email: true,
								phone: true,
								contact: true
							}
						}
					},
					orderBy: {
						user: {
							surname: 'asc'
						}
					}
				}
			}
		})
	}

	private resolveRequestedTeamFormat(
		eventFormat: EventFormat,
		requestedFormat?: TeamFormat
	) {
		if (eventFormat === EventFormat.HYBRID) {
			if (!requestedFormat) {
				throw new BadRequestException('Для этого мероприятия нужно выбрать формат команды')
			}

			return requestedFormat
		}

		return this.resolveTeamFormatForEvent(eventFormat)
	}

	private resolveTeamFormatForEvent(eventFormat: EventFormat) {
		return eventFormat === EventFormat.OFFLINE ? TeamFormat.OFFLINE : TeamFormat.ONLINE
	}

	private optionalString(value?: string) {
		const normalized = value?.trim()
		return normalized ? normalized : undefined
	}
}
