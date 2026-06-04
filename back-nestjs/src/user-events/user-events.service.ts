import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { EventStatus, Prisma, Role } from '@prisma/client'
import { getCaseTimeState, getEventTimeState } from '@/events/event-time-state'
import { SaveUserEventSolutionDto } from './dto/save-user-event-solution.dto'

@Injectable()
export class UserEventsService {
	constructor(private readonly prisma: PrismaService) {}

	async getFeed(userId: string) {
		await this.requireRegularUser(userId)

		const events = await this.prisma.event.findMany({
			where: {
				status: {
					notIn: [EventStatus.PRIVATE, EventStatus.FINISHED]
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
				dateDeadLine: true,
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
				tag: {
					select: {
						tag: {
							select: {
								idTag: true,
								name: true,
								type: true
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
				}
			},
			orderBy: [{ dataStart: 'asc' }, { title: 'asc' }]
		})

		return events.map(event => {
			const isParticipating = event.participant.length > 0
			const timeState = getEventTimeState(event)

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
				timeState,
				hasCases: event.hasCases,
				hasTeams: event.hasTeams,
				hasMaterials: event.hasMaterials,
				hasLoadedSolution: event.hasLoadedSolution,
				hasResualt: event.hasResualt,
				hasParticipantLimit: event.hasParticipantLimit,
				participantLimit: event.participantLimit,
				registeredUsersCount: event._count.participant,
				organization: event.organization,
				tags: event.tag.map(eventTag => eventTag.tag),
				isParticipating,
				canParticipate: isParticipating
					? false
					: this.canParticipateInEvent({
							status: event.status,
							dataStartRegistration: event.dataStartRegistration,
							dataEndRegistration: event.dataEndRegistration,
							dataStart: event.dataStart,
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
				AND: [
					{
						OR: [{ idEvent: eventId }, { slug: eventId }]
					},
					{
						OR: [
							{
								status: EventStatus.PUBLISHED
							},
							{
								participant: {
									some: {
										userId
									}
								}
							}
						]
					},
				]
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
				},
				adminAccess: {
					where: {
						canView: true
					},
					select: {
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
						createdAt: 'asc'
					}
				},
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
						userId: true,
						caseId: true,
						case: {
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
								tag: {
									select: {
										tag: {
											select: {
												idTag: true,
												name: true,
												type: true
											}
										}
									}
								},
								materials: {
									select: {
										idMaterial: true,
										title: true,
										description: true,
										url: true
									},
									orderBy: {
										title: 'asc'
									}
								}
							}
						}
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
						tag: {
							select: {
								tag: {
									select: {
										idTag: true,
										name: true,
										type: true
									}
								}
							}
						},
						_count: {
							select: {
								teams: true,
								userEvent: true
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
						caseId: true,
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
			throw new NotFoundException('РњРµСЂРѕРїСЂРёСЏС‚РёРµ РЅРµ РЅР°Р№РґРµРЅРѕ')
		}

		const timeState = getEventTimeState(event)
		const currentParticipant = event.participant[0] ?? null
		const isParticipating = Boolean(currentParticipant)
		const teamContext =
			isParticipating && event.hasTeams
				? await this.findUserTeamContext(userId, eventId)
				: null
		const currentSolution = isParticipating
			? await this.findCurrentSolution(userId, eventId, event.hasTeams, teamContext?.teamId)
			: null

		let resolvedSelectedCaseId = currentParticipant?.caseId ?? null
		let resolvedSelectedCase = currentParticipant?.case ?? null

		if (
			isParticipating &&
			!resolvedSelectedCaseId &&
			teamContext?.selectedCaseId
		) {
			resolvedSelectedCaseId = teamContext.selectedCaseId
			resolvedSelectedCase = await this.prisma.case.findUnique({
				where: {
					idCase: teamContext.selectedCaseId
				},
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
					tag: {
						select: {
							tag: {
								select: {
									idTag: true,
									name: true,
									type: true
								}
							}
						}
					},
					materials: {
						select: {
							idMaterial: true,
							title: true,
							description: true,
							url: true
						},
						orderBy: {
							title: 'asc'
						}
					}
				}
			})

			await this.prisma.userEvent.update({
				where: {
					eventId_userId: {
						eventId,
						userId
					}
				},
				data: {
					caseId: teamContext.selectedCaseId
				}
			})
		}

		const selectedCaseTimeState = resolvedSelectedCase
			? getCaseTimeState(resolvedSelectedCase)
			: null
		const solutionDeadline =
			event.hasCases && selectedCaseTimeState
				? selectedCaseTimeState.solutionDeadline
				: event.dateDeadLine
		const isSolutionDeadlinePassed = solutionDeadline
			? new Date() >= solutionDeadline
			: false
		const canUploadSolution =
			timeState.isEventStarted &&
			!timeState.isEventFinished &&
			!isSolutionDeadlinePassed &&
			(!event.hasCases || Boolean(resolvedSelectedCase))
		const eventAdminsById = new Map(
			[
				event.user,
				...event.adminAccess.map(adminAccess => adminAccess.user)
			].map(admin => [admin.idUser, admin])
		)

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
			timeState: {
				...timeState,
				canUploadSolution,
				solutionDeadline,
				isSolutionDeadlinePassed
			},
			hasCases: event.hasCases,
			hasTeams: event.hasTeams,
			hasMaterials: event.hasMaterials,
			hasLoadedSolution: event.hasLoadedSolution,
			hasResualt: event.hasResualt,
			hasParticipantLimit: event.hasParticipantLimit,
			participantLimit: event.participantLimit,
			participanInTeamLimit: event.participanInTeamLimit,
			isParticipating,
			selectedCaseId: resolvedSelectedCaseId,
			canParticipate: isParticipating
				? false
				: this.canParticipateInEvent({
						status: event.status,
						dataStartRegistration: event.dataStartRegistration,
						dataEndRegistration: event.dataEndRegistration,
						dataStart: event.dataStart,
						hasParticipantLimit: event.hasParticipantLimit,
						participantLimit: event.participantLimit,
						registeredUsersCount: event._count.participant
				  }),
			organization: {
				idOrganization: event.organization.idOrganization,
				name: event.organization.name,
				description: event.organization.description,
				address: event.organization.address,
				cordinatX: event.organization.cordinatX,
				cordinatY: event.organization.cordinatY,
				email: event.organization.owner.email,
				contact: event.organization.owner.contact
			},
			admins: [...eventAdminsById.values()].map(admin => ({
				idUser: admin.idUser,
				name: admin.name,
				surname: admin.surname,
				patronymic: admin.patronymic,
				email: admin.email,
				phone: admin.phone,
				contact: admin.contact
			})),
			cases: event.cases.map(eventCase => {
				const caseTimeState = getCaseTimeState(eventCase)

				return {
					idCase: eventCase.idCase,
					title: eventCase.title,
					description: eventCase.description,
					holder: eventCase.holder,
					teamLimit: eventCase.teamLimit,
					isOpen: eventCase.isOpen,
					dateForStartSelected: eventCase.dateForStartSelected,
					dateForEndSelected: eventCase.dateForEndSelected,
					dateStopCode: eventCase.dateStopCode,
					tags: eventCase.tag.map(caseTag => caseTag.tag),
					timeState: {
						...caseTimeState,
						canViewCaseMaterials: timeState.isEventStarted
					},
					occupiedPlaces: event.hasTeams
						? eventCase._count.teams
						: eventCase._count.userEvent
				}
			}),
			materials: timeState.canViewEventMaterials ? event.materials : [],
			selectedCase: resolvedSelectedCase
				? {
						idCase: resolvedSelectedCase.idCase,
						title: resolvedSelectedCase.title,
						description: resolvedSelectedCase.description,
						holder: resolvedSelectedCase.holder,
						teamLimit: resolvedSelectedCase.teamLimit,
						isOpen: resolvedSelectedCase.isOpen,
						dateForStartSelected: resolvedSelectedCase.dateForStartSelected,
						dateForEndSelected: resolvedSelectedCase.dateForEndSelected,
						dateStopCode: resolvedSelectedCase.dateStopCode,
						tags: resolvedSelectedCase.tag.map(caseTag => caseTag.tag)
				  }
				: null,
			selectedCaseMaterials:
				timeState.isEventStarted && resolvedSelectedCase
					? resolvedSelectedCase.materials
					: [],
			teamContext,
			solution: currentSolution
				? {
						idSolution: currentSolution.idSolution,
						urlSolution: currentSolution.urlSolution,
						urlPresentation: currentSolution.urlPresentation,
						description: currentSolution.description,
						updatedAt: currentSolution.updateAt
				  }
				: null,
			results: timeState.isEventFinished ? event.results.map(result => ({
				idResult: result.idResult,
				title: result.title,
				place: result.place,
				caseId: result.caseId,
				description: result.description,
				score: result.score,
				teamName: result.team?.name ?? null,
				userName:
					result.user?.name || result.user?.surname
						? [result.user?.surname, result.user?.name].filter(Boolean).join(' ')
						: result.user?.email ?? null
			})) : []
		}
	}

	async participate(userId: string, eventId: string) {
		await this.requireVerifiedRegularUser(userId)

		const event = await this.prisma.event.findUnique({
			where: {
				idEvent: eventId
			},
			select: {
				idEvent: true,
				status: true,
				dataStart: true,
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
			throw new NotFoundException('РњРµСЂРѕРїСЂРёСЏС‚РёРµ РЅРµ РЅР°Р№РґРµРЅРѕ')
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
			throw new BadRequestException('Р’С‹ СѓР¶Рµ СѓС‡Р°СЃС‚РІСѓРµС‚Рµ РІ СЌС‚РѕРј РјРµСЂРѕРїСЂРёСЏС‚РёРё')
		}

		if (
			!this.canParticipateInEvent({
				status: event.status,
				dataStartRegistration: event.dataStartRegistration,
				dataEndRegistration: event.dataEndRegistration,
				dataStart: event.dataStart,
				hasParticipantLimit: event.hasParticipantLimit,
				participantLimit: event.participantLimit,
				registeredUsersCount: event._count.participant
			})
		) {
			throw new BadRequestException(
				'РЎРµР№С‡Р°СЃ СЂРµРіРёСЃС‚СЂР°С†РёСЏ РЅР° СЌС‚Рѕ РјРµСЂРѕРїСЂРёСЏС‚РёРµ РЅРµРґРѕСЃС‚СѓРїРЅР°'
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
					'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ СѓС‡Р°СЃС‚РёРµ. РџСЂРѕРІРµСЂСЊС‚Рµ СЃС…РµРјСѓ С‚Р°Р±Р»РёС†С‹ user_event Рё РµС‘ СѓРЅРёРєР°Р»СЊРЅС‹Рµ РёРЅРґРµРєСЃС‹.'
				)
			}

			throw error
		}

		return { success: true }
	}

	async leave(userId: string, eventId: string) {
		await this.requireRegularUser(userId)

		const participant = await this.prisma.userEvent.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			select: {
				eventId: true,
				userId: true,
				event: {
					select: {
						hasTeams: true
					}
				}
			}
		})

		if (!participant) {
			throw new BadRequestException('Вы не участвуете в этом мероприятии')
		}

		if (!participant.event.hasTeams) {
			await this.prisma.$transaction(async prisma => {
				await prisma.solution.deleteMany({
					where: {
						eventId,
						userId
					}
				})

				await prisma.result.deleteMany({
					where: {
						eventId,
						userId
					}
				})

				await prisma.userEvent.delete({
					where: {
						eventId_userId: {
							eventId,
							userId
						}
					}
				})
			})

			return { success: true }
		}

		const team = await this.prisma.team.findFirst({
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
				captionId: true,
				caseId: true,
				user: {
					select: {
						userId: true
					}
				}
			}
		})

		if (team?.caseId) {
			throw new BadRequestException(
				'Команда уже выбрала кейс, поэтому покинуть мероприятие нельзя'
			)
		}

		await this.prisma.$transaction(async prisma => {
			await prisma.teamJoinRequest.deleteMany({
				where: {
					userId,
					team: {
						eventId
					}
				}
			})

			await prisma.solution.deleteMany({
				where: {
					eventId,
					userId
				}
			})

			await prisma.result.deleteMany({
				where: {
					eventId,
					userId
				}
			})

			if (team) {
				if (team.captionId === userId) {
					const memberIds = team.user.map(member => member.userId)

					await prisma.teamJoinRequest.deleteMany({
						where: {
							teamId: team.idTeam
						}
					})

					await prisma.solution.deleteMany({
						where: {
							teamId: team.idTeam
						}
					})

					await prisma.result.deleteMany({
						where: {
							teamId: team.idTeam
						}
					})

					await prisma.userEvent.updateMany({
						where: {
							eventId,
							userId: {
								in: memberIds
							}
						},
						data: {
							caseId: null
						}
					})

					await prisma.userTeam.deleteMany({
						where: {
							teamId: team.idTeam
						}
					})

					await prisma.team.delete({
						where: {
							idTeam: team.idTeam
						}
					})
				} else {
					await prisma.userTeam.deleteMany({
						where: {
							teamId: team.idTeam,
							userId
						}
					})

					await prisma.userEvent.update({
						where: {
							eventId_userId: {
								eventId,
								userId
							}
						},
						data: {
							caseId: null
						}
					})
				}
			}

			await prisma.userEvent.delete({
				where: {
					eventId_userId: {
						eventId,
						userId
					}
				}
			})
		})

		return { success: true }
	}

	async selectCase(userId: string, eventId: string, caseId: string) {
		await this.requireVerifiedRegularUser(userId)

		const participant = await this.prisma.userEvent.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			select: {
				eventId: true,
				userId: true,
				caseId: true,
				event: {
					select: {
						idEvent: true,
						hasCases: true,
						hasTeams: true
					}
				}
			}
		})

		if (!participant) {
			throw new ForbiddenException('Сначала необходимо зарегистрироваться на мероприятие')
		}

		if (!participant.event.hasCases) {
			throw new BadRequestException('Для этого мероприятия выбор кейса недоступен')
		}

		if (participant.caseId) {
			throw new BadRequestException('Кейс для этого участия уже выбран')
		}

		const eventCase = await this.prisma.case.findFirst({
			where: {
				idCase: caseId,
				eventId
			},
			select: {
				idCase: true,
				isOpen: true,
				dateForStartSelected: true,
				dateForEndSelected: true
			}
		})

		if (!eventCase) {
			throw new NotFoundException('Кейс не найден в этом мероприятии')
		}

		this.assertCaseSelectionAvailability(eventCase)

		if (participant.event.hasTeams) {
			const team = await this.prisma.team.findFirst({
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
					captionId: true,
					caseId: true,
					user: {
						select: {
							userId: true
						}
					}
				}
			})

			if (!team) {
				throw new BadRequestException('Сначала необходимо создать команду или вступить в неё')
			}

			if (team.captionId !== userId) {
				throw new ForbiddenException('Выбирать кейс для команды может только капитан')
			}

			if (team.caseId) {
				throw new BadRequestException('Для этой команды кейс уже выбран')
			}

			await this.prisma.$transaction(async prisma => {
				await prisma.team.update({
					where: {
						idTeam: team.idTeam
					},
					data: {
						caseId
					}
				})

				await prisma.userEvent.updateMany({
					where: {
						eventId,
						userId: {
							in: team.user.map(member => member.userId)
						}
					},
					data: {
						caseId
					}
				})
			})
		} else {
			await this.prisma.userEvent.update({
				where: {
					eventId_userId: {
						eventId,
						userId
					}
				},
				data: {
					caseId
				}
			})
		}

		return this.getEventDetails(userId, eventId)
	}

	async saveSolution(
		userId: string,
		eventId: string,
		dto: SaveUserEventSolutionDto
	) {
		await this.requireVerifiedRegularUser(userId)

		const normalizedUrlSolution = dto.urlSolution?.trim()
		const normalizedUrlPresentation = dto.urlPresentation?.trim()
		const normalizedDescription = dto.description?.trim() || null

		if (!normalizedUrlSolution || !normalizedUrlPresentation) {
			throw new BadRequestException(
				'Ссылка на решение и ссылка на презентацию обязательны'
			)
		}

		const participant = await this.prisma.userEvent.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			select: {
				caseId: true,
				event: {
					select: {
						idEvent: true,
						hasCases: true,
						hasTeams: true,
						hasLoadedSolution: true,
						status: true,
						dataStart: true,
						dataEnd: true,
						dataStartRegistration: true,
						dataEndRegistration: true,
						dateDeadLine: true
					}
				}
			}
		})

		if (!participant) {
			throw new ForbiddenException(
				'Сначала необходимо зарегистрироваться на мероприятие'
			)
		}

		if (!participant.event.hasLoadedSolution) {
			throw new BadRequestException(
				'Загрузка решения недоступна для этого мероприятия'
			)
		}

		const timeState = getEventTimeState(participant.event)

		if (!timeState.isEventStarted) {
			throw new BadRequestException(
				'Загружать решение можно только когда мероприятие открыто'
			)
		}

		if (timeState.isEventFinished) {
			throw new BadRequestException('Мероприятие уже завершилось')
		}

		if (
			!participant.event.hasCases &&
			participant.event.dateDeadLine &&
			new Date() >= participant.event.dateDeadLine
		) {
			throw new BadRequestException('Дедлайн загрузки решения уже завершён')
		}
		if (participant.event.hasTeams) {
			const teamContext = await this.findUserTeamContext(userId, eventId)

			if (!teamContext?.hasTeam || !teamContext.teamId) {
				throw new BadRequestException(
					'Сначала необходимо создать команду или вступить в неё'
				)
			}

			if (!teamContext.isCaptain) {
				throw new ForbiddenException(
					'Загружать решение для команды может только капитан'
				)
			}

			const resolvedCaseId =
				participant.caseId ?? teamContext.selectedCaseId ?? null

			if (participant.event.hasCases && !resolvedCaseId) {
				throw new BadRequestException(
					'Сначала необходимо выбрать кейс для команды'
				)
			}

			if (participant.event.hasCases && resolvedCaseId) {
				await this.assertSolutionDeadlineAvailable(resolvedCaseId)
			}

			await this.prisma.solution.upsert({
				where: {
					eventId_teamId: {
						eventId,
						teamId: teamContext.teamId
					}
				},
				update: {
					urlSolution: normalizedUrlSolution,
					urlPresentation: normalizedUrlPresentation,
					description: normalizedDescription,
					caseId: resolvedCaseId
				},
				create: {
					eventId,
					teamId: teamContext.teamId,
					caseId: resolvedCaseId,
					urlSolution: normalizedUrlSolution,
					urlPresentation: normalizedUrlPresentation,
					description: normalizedDescription
				}
			})

			return this.getEventDetails(userId, eventId)
		}

		if (participant.event.hasCases && participant.caseId) {
			await this.assertSolutionDeadlineAvailable(participant.caseId)
		}

		if (participant.event.hasCases && !participant.caseId) {
			throw new BadRequestException('Сначала необходимо выбрать кейс')
		}

		await this.prisma.solution.upsert({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			update: {
				urlSolution: normalizedUrlSolution,
				urlPresentation: normalizedUrlPresentation,
				description: normalizedDescription,
				caseId: participant.caseId
			},
			create: {
				eventId,
				userId,
				caseId: participant.caseId,
				urlSolution: normalizedUrlSolution,
				urlPresentation: normalizedUrlPresentation,
				description: normalizedDescription
			}
		})

		return this.getEventDetails(userId, eventId)
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
			throw new NotFoundException('РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ')
		}

		if (user.role !== Role.USER) {
			throw new ForbiddenException(
				'Р­С‚РѕС‚ СЂР°Р·РґРµР» РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РѕР±С‹С‡РЅС‹Рј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРј'
			)
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

	private canParticipateInEvent(params: {
		status: EventStatus
		dataStartRegistration: Date | null
		dataEndRegistration: Date | null
		dataStart: Date
		hasParticipantLimit: boolean
		participantLimit: number | null
		registeredUsersCount: number
	}) {
		if (
			params.status === EventStatus.PRIVATE ||
			params.status === EventStatus.FINISHED
		) {
			return false
		}

		const now = new Date()

		if (now >= params.dataStart) {
			return false
		}

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
			now >= params.dataEndRegistration
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

	private assertCaseSelectionAvailability(eventCase: {
		isOpen: boolean
		dateForStartSelected: Date
		dateForEndSelected: Date
	}) {
		const now = new Date()

		if (!eventCase.isOpen) {
			throw new BadRequestException('Этот кейс ещё не открыт для выбора')
		}

		if (now < eventCase.dateForStartSelected) {
			throw new BadRequestException('Период выбора кейса ещё не начался')
		}

		if (now >= eventCase.dateForEndSelected) {
			throw new BadRequestException('Период выбора кейса уже завершён')
		}
	}

	private async assertSolutionDeadlineAvailable(caseId: string) {
		const eventCase = await this.prisma.case.findUnique({
			where: {
				idCase: caseId
			},
			select: {
				dateStopCode: true
			}
		})

		if (!eventCase) {
			throw new NotFoundException('Кейс не найден')
		}

		if (new Date() >= eventCase.dateStopCode) {
			throw new BadRequestException('Время для загрузки решения завершилось')
		}
	}
	private async findUserTeamContext(userId: string, eventId: string) {
		const team = await this.prisma.team.findFirst({
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
				captionId: true,
				caseId: true
			}
		})

		return {
			hasTeam: Boolean(team),
			teamId: team?.idTeam ?? null,
			isCaptain: team?.captionId === userId,
			selectedCaseId: team?.caseId ?? null
		}
	}

	private async findCurrentSolution(
		userId: string,
		eventId: string,
		hasTeams: boolean,
		teamId?: string | null
	) {
		if (hasTeams) {
			if (!teamId) {
				return null
			}

			return this.prisma.solution.findUnique({
				where: {
					eventId_teamId: {
						eventId,
						teamId
					}
				},
				select: {
					idSolution: true,
					urlSolution: true,
					urlPresentation: true,
					description: true,
					updateAt: true
				}
			})
		}

		return this.prisma.solution.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			select: {
				idSolution: true,
				urlSolution: true,
				urlPresentation: true,
				description: true,
				updateAt: true
			}
		})
	}
}
