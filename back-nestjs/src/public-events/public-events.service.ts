import { PrismaService } from '@/prisma.service'
import { EventStatus } from '@prisma/client'
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class PublicEventsService {
	constructor(private readonly prisma: PrismaService) {}

	async getFeed() {
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
				hasCases: true,
				hasTeams: true,
				hasMaterials: true,
				hasLoadedSolution: true,
				hasResualt: true,
				organization: {
					select: {
						idOrganization: true,
						name: true
					}
				}
			},
			orderBy: [{ dataStart: 'asc' }, { title: 'asc' }]
		})

		return events
	}

	async getEventDetails(eventId: string) {
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
			throw new NotFoundException('Мероприятие недоступно')
		}

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
				occupiedPlaces: event.hasTeams
					? eventCase._count.teams
					: eventCase._count.userEvent
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
}
