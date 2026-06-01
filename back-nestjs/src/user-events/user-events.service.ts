import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { EventStatus, Prisma, Role } from '@prisma/client'

@Injectable()
export class UserEventsService {
	constructor(private readonly prisma: PrismaService) {}

	async getFeed(userId: string) {
		await this.requireRegularUser(userId)

		const events = await this.prisma.event.findMany({
			where: {
				status: {
					not: EventStatus.PRIVATE
				}
			},
			select: {
				idEvent: true,
				title: true,
				description: true,
				slug: true,
				type: true,
				format: true,
				status: true,
				dataStart: true,
				dataEnd: true,
				dataStartRegistration: true,
				dataEndRegistration: true,
				hasCases: true,
				hasTeams: true,
				hasMaterials: true,
				hasLoadedSolution: true,
				hasResualt: true,
				hasParticipantLimit: true,
				participantLimit: true,
				_count: {
					select: {
						participant: true
					}
				},
				organization: {
					select: {
						idOrganization: true,
						name: true
					}
				},
				participant: {
					where: {
						userId
					},
					select: {
						userId: true
					}
				}
			},
			orderBy: [{ dataStart: 'asc' }, { title: 'asc' }]
		})

		return events.map(event => {
			const isParticipating = event.participant.length > 0

			return {
				idEvent: event.idEvent,
				title: event.title,
				description: event.description,
				slug: event.slug,
				type: event.type,
				format: event.format,
				status: event.status,
				dataStart: event.dataStart,
				dataEnd: event.dataEnd,
				dataStartRegistration: event.dataStartRegistration,
				dataEndRegistration: event.dataEndRegistration,
				hasCases: event.hasCases,
				hasTeams: event.hasTeams,
				hasMaterials: event.hasMaterials,
				hasLoadedSolution: event.hasLoadedSolution,
				hasResualt: event.hasResualt,
				hasParticipantLimit: event.hasParticipantLimit,
				participantLimit: event.participantLimit,
				registeredUsersCount: event._count.participant,
				organization: event.organization,
				isParticipating,
				canParticipate: isParticipating
					? false
					: this.canParticipateInEvent({
							status: event.status,
							dataStartRegistration: event.dataStartRegistration,
							dataEndRegistration: event.dataEndRegistration,
							hasParticipantLimit: event.hasParticipantLimit,
							participantLimit: event.participantLimit,
							registeredUsersCount: event._count.participant
					  })
			}
		})
	}

	async getMyEvents(userId: string) {
		await this.requireRegularUser(userId)

		const relations = await this.prisma.userEvent.findMany({
			where: {
				userId
			},
			select: {
				createAt: true,
				event: {
					select: {
						idEvent: true,
						title: true,
						slug: true
					}
				}
			},
			orderBy: {
				createAt: 'desc'
			}
		})

		return relations.map(({ event, createAt }) => ({
			idEvent: event.idEvent,
			title: event.title,
			slug: event.slug,
			createAt
		}))
	}

	async getEventDetails(userId: string, eventId: string) {
		await this.requireRegularUser(userId)

		const event = await this.prisma.event.findFirst({
			where: {
				idEvent: eventId,
				status: {
					not: EventStatus.PRIVATE
				}
			},
			select: {
				idEvent: true,
				title: true,
				description: true,
				slug: true,
				type: true,
				format: true,
				status: true,
				address: true,
				cordinatX: true,
				cordinatY: true,
				dataStart: true,
				dataEnd: true,
				dataStartRegistration: true,
				dataEndRegistration: true,
				dateDeadLine: true,
				hasCases: true,
				hasTeams: true,
				hasMaterials: true,
				hasLoadedSolution: true,
				hasResualt: true,
				hasParticipantLimit: true,
				participantLimit: true,
				participanInTeamLimit: true,
				_count: {
					select: {
						participant: true
					}
				},
				organization: {
					select: {
						idOrganization: true,
						name: true,
						description: true,
						address: true,
						owner: {
							select: {
								email: true,
								contact: true
							}
						}
					}
				},
				participant: {
					where: {
						userId
					},
					select: {
						userId: true
					}
				},
				cases: {
					select: {
						idCase: true,
						title: true,
						description: true,
						holder: true,
						teamLimit: true,
						isOpen: true,
						dateForStartSelected: true,
						dateForEndSelected: true,
						dateStopCode: true,
						_count: {
							select: {
								teams: true
							}
						}
					},
					orderBy: {
						title: 'asc'
					}
				},
				materials: {
					where: {
						caseId: null
					},
					select: {
						idMaterial: true,
						title: true,
						description: true,
						url: true
					},
					orderBy: {
						title: 'asc'
					}
				},
				results: {
					select: {
						idResult: true,
						title: true,
						place: true,
						description: true,
						score: true,
						team: {
							select: {
								name: true
							}
						},
						user: {
							select: {
								name: true,
								surname: true,
								email: true
							}
						}
					},
					orderBy: [{ place: 'asc' }, { title: 'asc' }]
				}
			}
		})

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		const isParticipating = event.participant.length > 0

		return {
			idEvent: event.idEvent,
			title: event.title,
			description: event.description,
			slug: event.slug,
			type: event.type,
			format: event.format,
			status: event.status,
			address: event.address,
			cordinatX: event.cordinatX,
			cordinatY: event.cordinatY,
			dataStart: event.dataStart,
			dataEnd: event.dataEnd,
			dataStartRegistration: event.dataStartRegistration,
			dataEndRegistration: event.dataEndRegistration,
			dateDeadLine: event.dateDeadLine,
			hasCases: event.hasCases,
			hasTeams: event.hasTeams,
			hasMaterials: event.hasMaterials,
			hasLoadedSolution: event.hasLoadedSolution,
			hasResualt: event.hasResualt,
			hasParticipantLimit: event.hasParticipantLimit,
			participantLimit: event.participantLimit,
			participanInTeamLimit: event.participanInTeamLimit,
			isParticipating,
			canParticipate: isParticipating
				? false
				: this.canParticipateInEvent({
						status: event.status,
						dataStartRegistration: event.dataStartRegistration,
						dataEndRegistration: event.dataEndRegistration,
						hasParticipantLimit: event.hasParticipantLimit,
						participantLimit: event.participantLimit,
						registeredUsersCount: event._count.participant
				  }),
			organization: {
				idOrganization: event.organization.idOrganization,
				name: event.organization.name,
				description: event.organization.description,
				address: event.organization.address,
				email: event.organization.owner.email,
				contact: event.organization.owner.contact
			},
			cases: event.cases.map(eventCase => ({
				idCase: eventCase.idCase,
				title: eventCase.title,
				description: eventCase.description,
				holder: eventCase.holder,
				teamLimit: eventCase.teamLimit,
				isOpen: eventCase.isOpen,
				dateForStartSelected: eventCase.dateForStartSelected,
				dateForEndSelected: eventCase.dateForEndSelected,
				dateStopCode: eventCase.dateStopCode,
				occupiedPlaces: eventCase._count.teams
			})),
			materials: event.materials,
			results: event.results.map(result => ({
				idResult: result.idResult,
				title: result.title,
				place: result.place,
				description: result.description,
				score: result.score,
				teamName: result.team?.name ?? null,
				userName:
					result.user?.name || result.user?.surname
						? [result.user?.surname, result.user?.name].filter(Boolean).join(' ')
						: result.user?.email ?? null
			}))
		}
	}

	async participate(userId: string, eventId: string) {
		await this.requireRegularUser(userId)

		const event = await this.prisma.event.findUnique({
			where: {
				idEvent: eventId
			},
			select: {
				idEvent: true,
				status: true,
				dataStartRegistration: true,
				dataEndRegistration: true,
				hasParticipantLimit: true,
				participantLimit: true,
				_count: {
					select: {
						participant: true
					}
				}
			}
		})

		if (!event) {
			throw new NotFoundException('Мероприятие не найдено')
		}

		const existingRelation = await this.prisma.userEvent.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			}
		})

		if (existingRelation) {
			throw new BadRequestException('Вы уже участвуете в этом мероприятии')
		}

		if (
			!this.canParticipateInEvent({
				status: event.status,
				dataStartRegistration: event.dataStartRegistration,
				dataEndRegistration: event.dataEndRegistration,
				hasParticipantLimit: event.hasParticipantLimit,
				participantLimit: event.participantLimit,
				registeredUsersCount: event._count.participant
				})
		) {
			throw new BadRequestException(
				'Сейчас регистрация на это мероприятие недоступна'
			)
		}

		try {
			await this.prisma.userEvent.create({
				data: {
					eventId,
					userId
				}
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			) {
				throw new BadRequestException(
					'Не удалось зарегистрировать участие. Проверьте схему таблицы user_event и её уникальные индексы.'
				)
			}

			throw error
		}

		return { success: true }
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
				'Этот раздел доступен только обычным пользователям'
			)
		}

		return user
	}

	private canParticipateInEvent(params: {
		status: EventStatus
		dataStartRegistration: Date | null
		dataEndRegistration: Date | null
		hasParticipantLimit: boolean
		participantLimit: number | null
		registeredUsersCount: number
	}) {
		if (
			params.status === EventStatus.PRIVATE ||
			params.status === EventStatus.FINISHED ||
			params.status === EventStatus.CLOSED_REGISTRATION
		) {
			return false
		}

		const now = new Date()
		const hasBrokenRegistrationWindow =
			params.dataStartRegistration &&
			params.dataEndRegistration &&
			params.dataStartRegistration > params.dataEndRegistration

		if (
			!hasBrokenRegistrationWindow &&
			params.dataStartRegistration &&
			now < params.dataStartRegistration
		) {
			return false
		}

		if (
			!hasBrokenRegistrationWindow &&
			params.dataEndRegistration &&
			now > params.dataEndRegistration
		) {
			return false
		}

		if (
			params.hasParticipantLimit &&
			params.participantLimit !== null &&
			params.registeredUsersCount >= params.participantLimit
		) {
			return false
		}

		return true
	}
}
