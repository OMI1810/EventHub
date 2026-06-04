import { InviteCoreService } from '@/invites/invite-core.service'
import { BaseInvitePayload } from '@/invites/invite.types'
import { PrismaService } from '@/prisma.service'
import { TeamInviteService } from '@/user-teams/team-invite.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { EventStatus, Role, StatusJoinRequest } from '@prisma/client'

interface EventInvitePayload extends BaseInvitePayload {
	eventId: string
	createdByUserId: string
}

@Injectable()
export class UserRequestsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly teamInviteService: TeamInviteService,
		private readonly inviteCoreService: InviteCoreService
	) {}

	async getMyRequests(userId: string) {
		await this.requireRegularUser(userId)

		const [teamRequests, eventRequests] = await Promise.all([
			this.prisma.teamJoinRequest.findMany({
				where: {
					userId
				},
				select: {
					idJoinTeam: true,
					status: true,
					team: {
						select: {
							idTeam: true,
							name: true,
							event: {
								select: {
									idEvent: true,
									slug: true,
									title: true,
									type: true,
									format: true,
									dataStart: true,
									dataEnd: true,
									organization: {
										select: {
											name: true
										}
									}
								}
							}
						}
					}
				}
			}),
			this.prisma.eventJoinRequest.findMany({
				where: {
					userId
				},
				select: {
					idJoinEvent: true,
					status: true,
					event: {
						select: {
							idEvent: true,
							slug: true,
							title: true,
							type: true,
							format: true,
							dataStart: true,
							dataEnd: true,
							organization: {
								select: {
									name: true
								}
							}
						}
					}
				}
			})
		])

		return [
			...eventRequests.map(request => ({
				id: request.idJoinEvent,
				type: 'event' as const,
				status: request.status,
				event: {
					idEvent: request.event.idEvent,
					slug: request.event.slug,
					title: request.event.title,
					type: request.event.type,
					format: request.event.format,
					dataStart: request.event.dataStart,
					dataEnd: request.event.dataEnd,
					organizationName: request.event.organization.name
				}
			})),
			...teamRequests.map(request => ({
				id: request.idJoinTeam,
				type: 'team' as const,
				status: request.status,
				team: {
					idTeam: request.team.idTeam,
					name: request.team.name
				},
				event: {
					idEvent: request.team.event.idEvent,
					slug: request.team.event.slug,
					title: request.team.event.title,
					type: request.team.event.type,
					format: request.team.event.format,
					dataStart: request.team.event.dataStart,
					dataEnd: request.team.event.dataEnd,
					organizationName: request.team.event.organization.name
				}
			}))
		]
	}

	async submitByCode(userId: string, rawCode: string) {
		await this.requireVerifiedRegularUser(userId)

		const code = rawCode.trim()
		if (!code) {
			throw new BadRequestException('Введите код приглашения')
		}

		const teamInvite = await this.teamInviteService.findActiveInviteByCode(code)
		if (teamInvite) {
			await this.createTeamJoinRequest(userId, teamInvite.teamId, teamInvite.eventId)
			return { type: 'team' as const }
		}

		const eventInvite =
			await this.inviteCoreService.findScopedInviteByCode<EventInvitePayload>(
				'event',
				code
			)

		if (eventInvite) {
			await this.createEventJoinRequest(userId, eventInvite.eventId)
			return { type: 'event' as const }
		}

		throw new BadRequestException('Код приглашения недействителен или устарел')
	}

	async cancelTeamRequest(userId: string, requestId: string) {
		await this.requireRegularUser(userId)

		const request = await this.prisma.teamJoinRequest.findUnique({
			where: {
				idJoinTeam: requestId
			},
			select: {
				idJoinTeam: true,
				userId: true,
				status: true
			}
		})

		if (!request || request.userId !== userId) {
			throw new NotFoundException('Заявка не найдена')
		}

		if (request.status !== StatusJoinRequest.PENDING) {
			throw new BadRequestException('Отозвать можно только ожидающую заявку')
		}

		await this.prisma.teamJoinRequest.update({
			where: {
				idJoinTeam: request.idJoinTeam
			},
			data: {
				status: StatusJoinRequest.CANCELED
			}
		})

		return { success: true }
	}

	async cancelEventRequest(userId: string, requestId: string) {
		await this.requireRegularUser(userId)

		const request = await this.prisma.eventJoinRequest.findUnique({
			where: {
				idJoinEvent: requestId
			},
			select: {
				idJoinEvent: true,
				userId: true,
				status: true
			}
		})

		if (!request || request.userId !== userId) {
			throw new NotFoundException('Заявка не найдена')
		}

		if (request.status !== StatusJoinRequest.PENDING) {
			throw new BadRequestException('Отозвать можно только ожидающую заявку')
		}

		await this.prisma.eventJoinRequest.update({
			where: {
				idJoinEvent: request.idJoinEvent
			},
			data: {
				status: StatusJoinRequest.CANCELED
			}
		})

		return { success: true }
	}

	private async createTeamJoinRequest(
		userId: string,
		teamId: string,
		eventId: string
	) {
		const [event, existingTeam, existingPendingRequest, sameTeamRequest] =
			await Promise.all([
				this.prisma.event.findUnique({
					where: {
						idEvent: eventId
					},
					select: {
						idEvent: true,
						hasTeams: true,
						participant: {
							where: {
								userId
							},
							select: {
								userId: true
							}
						}
					}
				}),
				this.prisma.team.findFirst({
					where: {
						eventId,
						user: {
							some: {
								userId
							}
						}
					},
					select: {
						idTeam: true
					}
				}),
				this.prisma.teamJoinRequest.findFirst({
					where: {
						userId,
						status: StatusJoinRequest.PENDING,
						team: {
							eventId
						}
					}
				}),
				this.prisma.teamJoinRequest.findUnique({
					where: {
						userId_teamId: {
							userId,
							teamId
						}
					}
				})
			])

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		if (!event.hasTeams) {
			throw new BadRequestException('В этом мероприятии нет командного участия')
		}

		if (!event.participant.length) {
			throw new ForbiddenException(
				'Сначала необходимо зарегистрироваться на мероприятие'
			)
		}

		if (existingTeam) {
			throw new BadRequestException('Вы уже состоите в команде этого мероприятия')
		}

		if (existingPendingRequest) {
			throw new BadRequestException(
				'У вас уже есть ожидающая заявка в команду этого мероприятия'
			)
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
			return
		}

		await this.prisma.teamJoinRequest.create({
			data: {
				userId,
				teamId,
				status: StatusJoinRequest.PENDING
			}
		})
	}

	private async createEventJoinRequest(userId: string, eventId: string) {
		const [event, existingParticipant, existingRequest] = await Promise.all([
			this.prisma.event.findUnique({
				where: {
					idEvent: eventId
				},
				select: {
					idEvent: true,
					status: true
				}
			}),
			this.prisma.userEvent.findUnique({
				where: {
					eventId_userId: {
						eventId,
						userId
					}
				}
			}),
			this.prisma.eventJoinRequest.findUnique({
				where: {
					userId_eventId: {
						userId,
						eventId
					}
				}
			})
		])

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		if (event.status !== EventStatus.PRIVATE) {
			throw new BadRequestException(
				'Этот код предназначен только для приватных мероприятий'
			)
		}

		if (existingParticipant) {
			throw new BadRequestException('Вы уже участвуете в этом мероприятии')
		}

		if (existingRequest) {
			await this.prisma.eventJoinRequest.update({
				where: {
					idJoinEvent: existingRequest.idJoinEvent
				},
				data: {
					status: StatusJoinRequest.PENDING
				}
			})
			return
		}

		await this.prisma.eventJoinRequest.create({
			data: {
				userId,
				eventId,
				status: StatusJoinRequest.PENDING
			}
		})
	}

	private async requireRegularUser(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				idUser: userId
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

		if (user.role !== Role.USER) {
			throw new ForbiddenException('Раздел доступен только обычным пользователям')
		}

		return user
	}

	private async requireVerifiedRegularUser(userId: string) {
		const user = await this.requireRegularUser(userId)

		if (user.verificationToken) {
			throw new ForbiddenException(
				'Подтвердите почту перед участием в мероприятиях'
			)
		}

		return user
	}
}
