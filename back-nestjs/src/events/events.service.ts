import { InviteCoreService } from "@/invites/invite-core.service";
import { BaseInvitePayload } from "@/invites/invite.types";
import { PrismaService } from "@/prisma.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EventFormat,
  EventStatus,
  Prisma,
  Role,
  TagType,
} from "@prisma/client";
import {
  CreateEventDto,
  CreateEventStatus,
  CreateEventType,
  EventCaseDto,
  EventMaterialDto,
  EventTagInputDto,
} from "./dto/create-event.dto";
import {
  UpdateEventCaseMaterialDto,
  UpdateEventCasesDto,
  UpdateEventMaterialsDto,
  UpdateEventSettingsDto,
} from "./dto/update-event-blocks.dto";
import { UpdateEventGeneralDto } from "./dto/update-event-general.dto";
import {
  UpdateEventResultItemDto,
  UpdateEventResultsDto,
} from "./dto/update-event-results.dto";

interface EventFeaturePreset {
  hasCases: boolean;
  hasTeams: boolean;
  hasParticipantLimit: boolean;
  hasLoadedSolution: boolean;
  hasMaterials: boolean;
  hasResualt: boolean;
}

interface EventInvitePayload extends BaseInvitePayload {
  eventId: string;
  createdByUserId: string;
}

const EVENT_FEATURES: Record<CreateEventType, EventFeaturePreset> = {
  [CreateEventType.HACKATHON]: {
    hasCases: true,
    hasTeams: true,
    hasParticipantLimit: false,
    hasLoadedSolution: true,
    hasMaterials: false,
    hasResualt: true,
  },
  [CreateEventType.MASTER_CLASS]: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: true,
    hasLoadedSolution: false,
    hasMaterials: true,
    hasResualt: false,
  },
  [CreateEventType.CONTEST]: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: true,
    hasLoadedSolution: true,
    hasMaterials: true,
    hasResualt: true,
  },
};

@Injectable()
export class EventsService {
  private readonly inviteScope = "event";
  private readonly inviteTtlSeconds = 600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inviteCoreService: InviteCoreService,
  ) {}

  async getMyEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: this.getAccessibleEventWhere(userId),
      select: {
        idEvent: true,
        title: true,
        type: true,
        status: true,
        format: true,
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
            name: true,
          },
        },
        teams: {
          select: {
            user: {
              select: {
                userId: true,
              },
            },
          },
        },
        participant: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        dataStart: "desc",
      },
    });

    return events.map((event) => ({
      ...event,
      registeredUsersCount: event.hasTeams
        ? this.countUniqueTeamUsers(event.teams)
        : event.participant.length,
      teams: undefined,
      participant: undefined,
    }));
  }

  async getMyEventDetails(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        idEvent: eventId,
        ...this.getAccessibleEventWhere(userId),
      },
      select: {
        idEvent: true,
        title: true,
        description: true,
        slug: true,
        type: true,
        address: true,
        cordinatX: true,
        cordinatY: true,
        dataStartRegistration: true,
        dataEndRegistration: true,
        dataStart: true,
        dataEnd: true,
        dateDeadLine: true,
        format: true,
        status: true,
        hasCases: true,
        hasTeams: true,
        hasParticipantLimit: true,
        hasLoadedSolution: true,
        hasMaterials: true,
        hasResualt: true,
        participantLimit: true,
        participanInTeamLimit: true,
        organization: {
          select: {
            idOrganization: true,
            name: true,
          },
        },
        teams: {
          select: {
            idTeam: true,
            name: true,
            description: true,
            format: true,
            caseId: true,
            solutions: {
              where: {
                eventId,
              },
              select: {
                idSolution: true,
                urlSolution: true,
                urlPresentation: true,
                description: true,
                createdAt: true,
                updateAt: true,
                eventId: true,
                caseId: true,
                teamId: true,
                userId: true,
              },
              orderBy: {
                updateAt: "desc",
              },
              take: 1,
            },
            caption: {
              select: {
                idUser: true,
                email: true,
                name: true,
                surname: true,
              },
            },
            user: {
              select: {
                role: true,
                userId: true,
                user: {
                  select: {
                    idUser: true,
                    name: true,
                    surname: true,
                    patronymic: true,
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        participant: {
          select: {
            createAt: true,
            caseId: true,
            user: {
              select: {
                idUser: true,
                name: true,
                surname: true,
                patronymic: true,
                solutions: {
                  where: {
                    eventId,
                  },
                  select: {
                    idSolution: true,
                    urlSolution: true,
                    urlPresentation: true,
                    description: true,
                    createdAt: true,
                    updateAt: true,
                    eventId: true,
                    caseId: true,
                    teamId: true,
                    userId: true,
                  },
                  orderBy: {
                    updateAt: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            createAt: "asc",
          },
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
            materials: {
              select: {
                idMaterial: true,
                title: true,
                url: true,
              },
            },
            tag: {
              select: {
                tag: {
                  select: {
                    idTag: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: {
            title: "asc",
          },
        },
        materials: {
          where: {
            caseId: null,
          },
          select: {
            idMaterial: true,
            title: true,
            url: true,
          },
          orderBy: {
            title: "asc",
          },
        },
        results: {
          select: {
            idResult: true,
            place: true,
            caseId: true,
            teamId: true,
            userId: true,
          },
          orderBy: {
            place: "asc",
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Мероприятие не найдено");
    }

    return {
      ...event,
      registeredUsersCount: event.hasTeams
        ? this.countUniqueTeamUsers(event.teams)
        : event.participant.length,
      teams: event.teams.map((team) => ({
        ...team,
        membersCount: team.user.length,
        members: team.user.map((member) => ({
          role: member.role,
          user: member.user,
        })),
        latestSolution: team.solutions[0] ?? null,
        solutions: undefined,
        user: undefined,
      })),
      participant: event.participant.map((participant) => {
        const { solutions, ...user } = participant.user;

        return {
          ...participant,
          user,
          latestSolution: solutions[0] ?? null,
        };
      }),
      cases: event.cases.map((eventCase) => ({
        ...eventCase,
        tags: eventCase.tag.map((caseTag) => caseTag.tag),
        tag: undefined,
      })),
    };
  }

  async updateMyEventGeneral(
    userId: string,
    eventId: string,
    dto: UpdateEventGeneralDto,
  ) {
    const event = await this.ensureEditableEventAccess(userId, eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException(
        "Завершенное мероприятие нельзя редактировать",
      );
    }

    this.validateEventDateRange(dto.dataStart, dto.dataEnd);

    if (dto.status === CreateEventStatus.PUBLIC) {
      this.validateRegistrationDateRange(
        dto.dataStartRegistration!,
        dto.dataEndRegistration!,
      );
    }

    return this.prisma.event.update({
      where: {
        idEvent: eventId,
      },
      data: {
        title: dto.title.trim(),
        description: this.optionalString(dto.description),
        slug: dto.slug.trim(),
        dataStartRegistration:
          dto.status === CreateEventStatus.PUBLIC
            ? new Date(dto.dataStartRegistration!)
            : null,
        dataEndRegistration:
          dto.status === CreateEventStatus.PUBLIC
            ? new Date(dto.dataEndRegistration!)
            : null,
        dataStart: new Date(dto.dataStart),
        dataEnd: new Date(dto.dataEnd),
        format: dto.format,
        address:
          dto.format === EventFormat.ONLINE ? "Онлайн" : dto.address.trim(),
        cordinatX: dto.cordinatX ?? null,
        cordinatY: dto.cordinatY ?? null,
        status:
          dto.status === CreateEventStatus.PUBLIC
            ? EventStatus.PUBLISHED
            : EventStatus.PRIVATE,
      },
    });
  }

  async updateMyEventSettings(
    userId: string,
    eventId: string,
    dto: UpdateEventSettingsDto,
  ) {
    await this.ensureEditableEventAccess(userId, eventId);

    const currentEvent = await this.prisma.event.findUnique({
      where: {
        idEvent: eventId,
      },
      select: {
        hasCases: true,
        hasTeams: true,
        hasParticipantLimit: true,
        hasLoadedSolution: true,
        hasMaterials: true,
        hasResualt: true,
        participantLimit: true,
        participanInTeamLimit: true,
        dateDeadLine: true,
      },
    });

    if (!currentEvent) {
      throw new NotFoundException("Мероприятие не найдено");
    }

    const hasParticipantLimit =
      dto.hasParticipantLimit ?? currentEvent.hasParticipantLimit;
    const hasTeams = dto.hasTeams ?? currentEvent.hasTeams;
    const hasLoadedSolution =
      dto.hasLoadedSolution ?? currentEvent.hasLoadedSolution;
    const participantLimit =
      dto.participantLimit ?? currentEvent.participantLimit ?? undefined;
    const teamMemberLimit =
      dto.teamMemberLimit ?? currentEvent.participanInTeamLimit ?? undefined;
    const dateDeadLine = dto.dateDeadLine
      ? new Date(dto.dateDeadLine)
      : currentEvent.dateDeadLine;

    if (hasParticipantLimit && !participantLimit) {
      throw new BadRequestException("Требуется общий лимит участников");
    }

    if (hasTeams && !teamMemberLimit) {
      throw new BadRequestException("Требуется лимит участников в команде");
    }

    if (hasLoadedSolution && !dateDeadLine) {
      throw new BadRequestException("Требуется дедлайн загрузки решений");
    }

    return this.prisma.event.update({
      where: {
        idEvent: eventId,
      },
      data: {
        hasCases: dto.hasCases ?? currentEvent.hasCases,
        hasTeams,
        hasParticipantLimit,
        hasLoadedSolution,
        hasMaterials: dto.hasMaterials ?? currentEvent.hasMaterials,
        hasResualt: dto.hasResualt ?? currentEvent.hasResualt,
        participantLimit: hasParticipantLimit ? participantLimit : null,
        participanInTeamLimit: hasTeams ? teamMemberLimit : null,
        dateDeadLine: hasLoadedSolution ? dateDeadLine : null,
      },
    });
  }

  async updateMyEventMaterials(
    userId: string,
    eventId: string,
    dto: UpdateEventMaterialsDto,
  ) {
    await this.ensureEditableEventAccess(userId, eventId);
    const materialIds = dto.materials
      .map((material) => material.idMaterial)
      .filter((id): id is string => Boolean(id));

    await this.ensureMaterialsBelongToEvent(eventId, materialIds, null);

    return this.prisma.$transaction(async (prisma) => {
      const keepIds = new Set<string>();

      for (const material of dto.materials) {
        if (material.idMaterial) {
          keepIds.add(material.idMaterial);
          await prisma.material.update({
            where: {
              idMaterial: material.idMaterial,
            },
            data: {
              title: material.title.trim(),
              description: this.optionalString(material.description),
              url: material.url.trim(),
            },
          });
          continue;
        }

        const createdMaterial = await prisma.material.create({
          data: {
            title: material.title.trim(),
            description: this.optionalString(material.description),
            url: material.url.trim(),
            eventId,
          },
          select: {
            idMaterial: true,
          },
        });
        keepIds.add(createdMaterial.idMaterial);
      }

      await prisma.material.deleteMany({
        where: {
          eventId,
          caseId: null,
          idMaterial: {
            notIn: [...keepIds],
          },
        },
      });

      return prisma.event.findUnique({
        where: {
          idEvent: eventId,
        },
        include: {
          materials: {
            where: {
              caseId: null,
            },
            orderBy: {
              title: "asc",
            },
          },
        },
      });
    });
  }

  async updateMyEventCases(
    userId: string,
    eventId: string,
    dto: UpdateEventCasesDto,
  ) {
    await this.ensureEditableEventAccess(userId, eventId);
    const caseIds = dto.cases
      .map((eventCase) => eventCase.idCase)
      .filter((id): id is string => Boolean(id));

    await this.ensureCasesBelongToEvent(eventId, caseIds);

    return this.prisma.$transaction(async (prisma) => {
      const keepCaseIds = new Set<string>();

      for (const eventCase of dto.cases) {
        const caseData = {
          title: eventCase.title.trim(),
          description: this.optionalString(eventCase.description),
          holder: this.optionalString(eventCase.holder),
          teamLimit: eventCase.teamLimit ?? null,
          isOpen: eventCase.isOpen ?? false,
          dateForStartSelected: new Date(eventCase.dateForStartSelected),
          dateForEndSelected: new Date(eventCase.dateForEndSelected),
          dateStopCode: new Date(eventCase.dateStopCode),
        };

        const savedCase = eventCase.idCase
          ? await prisma.case.update({
              where: {
                idCase: eventCase.idCase,
              },
              data: caseData,
              select: {
                idCase: true,
              },
            })
          : await prisma.case.create({
              data: {
                ...caseData,
                eventId,
              },
              select: {
                idCase: true,
              },
            });

        keepCaseIds.add(savedCase.idCase);
        await this.syncCaseMaterials(
          prisma,
          eventId,
          savedCase.idCase,
          eventCase.materials ?? [],
        );
        await this.syncCaseTags(
          prisma,
          savedCase.idCase,
          userId,
          eventCase.tags ?? [],
        );
      }

      await this.deleteUnusedCases(prisma, eventId, [...keepCaseIds]);
      await prisma.event.update({
        where: {
          idEvent: eventId,
        },
        data: {
          hasCases: keepCaseIds.size > 0,
        },
      });

      return prisma.event.findUnique({
        where: {
          idEvent: eventId,
        },
        include: {
          cases: {
            include: {
              materials: true,
              tag: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              title: "asc",
            },
          },
        },
      });
    });
  }

  async updateMyEventResults(
    userId: string,
    eventId: string,
    dto: UpdateEventResultsDto,
  ) {
    await this.ensureEventAccess(userId, eventId);

    const event = await this.prisma.event.findUnique({
      where: {
        idEvent: eventId,
      },
      select: {
        idEvent: true,
        hasCases: true,
        hasTeams: true,
        hasResualt: true,
        cases: {
          select: {
            idCase: true,
          },
        },
        teams: {
          select: {
            idTeam: true,
            name: true,
            caseId: true,
          },
        },
        participant: {
          select: {
            caseId: true,
            userId: true,
            user: {
              select: {
                name: true,
                surname: true,
                patronymic: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Мероприятие не найдено");
    }

    if (!event.hasResualt) {
      throw new BadRequestException(
        "Для этого мероприятия не включены результаты",
      );
    }

    const results = this.validateEventResultsPayload(event, dto.results);

    await this.prisma.$transaction(async (prisma) => {
      for (const result of results) {
        const targetWhere = result.teamId
          ? { eventId, teamId: result.teamId }
          : { eventId, userId: result.userId };

        if (!result.place) {
          await prisma.result.deleteMany({
            where: targetWhere,
          });
          continue;
        }

        const existingResult = await prisma.result.findFirst({
          where: targetWhere,
          select: {
            idResult: true,
          },
        });

        const data = {
          title: `Place ${result.place}`,
          place: result.place,
          caseId: result.caseId,
          teamId: result.teamId ?? null,
          userId: result.userId ?? null,
        };

        if (existingResult) {
          await prisma.result.update({
            where: {
              idResult: existingResult.idResult,
            },
            data,
          });
          continue;
        }

        await prisma.result.create({
          data: {
            ...data,
            eventId,
          },
        });
      }
    });

    return this.getMyEventDetails(userId, eventId);
  }

  async finishMyEvent(userId: string, eventId: string) {
    await this.ensureEventAccess(userId, eventId);

    return this.prisma.event.update({
      where: {
        idEvent: eventId,
      },
      data: {
        status: EventStatus.FINISHED,
      },
    });
  }

  async createMyEventInvite(userId: string, eventId: string) {
    const event = await this.ensureEventAccess(userId, eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException(
        "Для завершенного мероприятия нельзя создать приглашение",
      );
    }

    const expiresAt = this.inviteCoreService.createExpiresAt(
      this.inviteTtlSeconds,
    );
    const payload: EventInvitePayload = {
      eventId,
      createdByUserId: userId,
      expiresAt,
      nonce: this.inviteCoreService.createNonce(),
    };

    return this.inviteCoreService.createScopedInvite({
      scope: this.inviteScope,
      entityId: eventId,
      payload,
      ttlSeconds: this.inviteTtlSeconds,
    });
  }

  async getCreateOptions(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        OR: [{ ownerUserId: userId }, { users: { some: { userId } } }],
      },
      select: {
        idOrganization: true,
        name: true,
        address: true,
        cordinatX: true,
        cordinatY: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const tags = await this.prisma.tag.findMany({
      where: {
        OR: [{ type: TagType.SYSTEM }, { type: TagType.CUSTOM, userId }],
      },
      select: {
        idTag: true,
        name: true,
        type: true,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return { organizations, tags };
  }

  async create(userId: string, dto: CreateEventDto) {
    const user = await this.prisma.user.findUnique({
      where: { idUser: userId },
      select: { idUser: true, role: true },
    });

    if (!user || (user.role !== Role.ADMIN && user.role !== Role.ORGANIZATOR)) {
      throw new ForbiddenException(
        "Только администратор и организатор может создать мероприятие",
      );
    }

    const organization = await this.prisma.organization.findFirst({
      where: {
        idOrganization: dto.organizationId,
        OR: [{ ownerUserId: userId }, { users: { some: { userId } } }],
      },
      select: { idOrganization: true },
    });

    if (!organization) {
      throw new ForbiddenException("Организации недоступны");
    }

    const features = this.resolveFeatures(dto);
    this.validatePresetPayload(dto, features);
    this.validateEventDateRange(dto.dataStart, dto.dataEnd);

    if (dto.status === CreateEventStatus.PUBLIC) {
      this.validateRegistrationDateRange(
        dto.dataStartRegistration!,
        dto.dataEndRegistration!,
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      const event = await prisma.event.create({
        data: {
          title: dto.title.trim(),
          description: this.optionalString(dto.description),
          slug: dto.slug.trim(),
          type: dto.type,
          address:
            dto.format === EventFormat.ONLINE ? "Онлайн" : dto.address.trim(),
          cordinatX: dto.cordinatX ?? null,
          cordinatY: dto.cordinatY ?? null,
          dataStartRegistration:
            dto.status === CreateEventStatus.PUBLIC
              ? new Date(dto.dataStartRegistration!)
              : null,
          dataEndRegistration:
            dto.status === CreateEventStatus.PUBLIC
              ? new Date(dto.dataEndRegistration!)
              : null,
          dataStart: new Date(dto.dataStart),
          dataEnd: new Date(dto.dataEnd),
          dateDeadLine: dto.dateDeadLine ? new Date(dto.dateDeadLine) : null,
          format: dto.format,
          status:
            dto.status === CreateEventStatus.PUBLIC
              ? EventStatus.PUBLISHED
              : EventStatus.PRIVATE,
          hasCases: features.hasCases,
          hasTeams: features.hasTeams,
          hasParticipantLimit: features.hasParticipantLimit,
          hasLoadedSolution: features.hasLoadedSolution,
          hasMaterials: features.hasMaterials,
          hasResualt: features.hasResualt,
          participantLimit: features.hasParticipantLimit
            ? dto.participantLimit
            : null,
          participanInTeamLimit: features.hasTeams ? dto.teamMemberLimit : null,
          organizationId: dto.organizationId,
          userId,
        },
      });

      await this.createTags(prisma, event.idEvent, userId, dto.tags ?? []);
      await this.createEventMaterials(
        prisma,
        event.idEvent,
        dto.eventMaterials ?? [],
      );
      await this.createCases(prisma, event.idEvent, userId, dto, features);

      return event;
    });
  }

  private validateEventResultsPayload(
    event: {
      hasCases: boolean;
      hasTeams: boolean;
      cases: Array<{ idCase: string }>;
      teams: Array<{ idTeam: string; name: string; caseId: string | null }>;
      participant: Array<{
        userId: string;
        caseId: string | null;
        user: {
          name: string | null;
          surname: string | null;
          patronymic: string | null;
        };
      }>;
    },
    items: UpdateEventResultItemDto[],
  ) {
    const caseIds = new Set(event.cases.map((eventCase) => eventCase.idCase));
    const teamById = new Map(event.teams.map((team) => [team.idTeam, team]));
    const participantByUserId = new Map(
      event.participant.map((participant) => [participant.userId, participant]),
    );
    const targetKeys = new Set<string>();
    const placeByScope = new Map<string, number>();

    return items.map((item) => {
      const hasTeam = Boolean(item.teamId);
      const hasUser = Boolean(item.userId);

      if (hasTeam === hasUser) {
        throw new BadRequestException(
          "Для результата нужно указать команду или участника",
        );
      }

      if (event.hasTeams && !item.teamId) {
        throw new BadRequestException(
          "Для командного мероприятия нужно указать команду",
        );
      }

      if (!event.hasTeams && !item.userId) {
        throw new BadRequestException(
          "Для индивидуального мероприятия нужно указать участника",
        );
      }

      const caseId = event.hasCases ? item.caseId : null;

      if (event.hasCases && (!caseId || !caseIds.has(caseId))) {
        throw new BadRequestException("Кейс не принадлежит мероприятию");
      }

      if (item.teamId) {
        const team = teamById.get(item.teamId);

        if (!team) {
          throw new BadRequestException("Команда не принадлежит мероприятию");
        }

        if (event.hasCases && team.caseId !== caseId) {
          throw new BadRequestException("Команда не выбрала этот кейс");
        }
      }

      if (item.userId) {
        const participant = participantByUserId.get(item.userId);

        if (!participant) {
          throw new BadRequestException("Участник не принадлежит мероприятию");
        }

        if (event.hasCases && participant.caseId !== caseId) {
          throw new BadRequestException("Участник не выбрал этот кейс");
        }
      }

      const targetKey = item.teamId
        ? `team:${item.teamId}`
        : `user:${item.userId}`;

      if (targetKeys.has(targetKey)) {
        throw new BadRequestException("Цель результата повторяется");
      }

      targetKeys.add(targetKey);

      if (item.place) {
        const scopeKey = event.hasCases ? caseId! : "event";
        const placeKey = `${scopeKey}:${item.place}`;

        if (placeByScope.has(placeKey)) {
          throw new BadRequestException("Места не должны повторяться");
        }

        placeByScope.set(placeKey, item.place);
      }

      return {
        caseId,
        teamId: item.teamId,
        userId: item.userId,
        place: item.place,
      };
    });
  }

  private validatePresetPayload(
    dto: CreateEventDto,
    features: EventFeaturePreset,
  ) {
    if (features.hasCases && !dto.caseSettings) {
      throw new BadRequestException("Требуется настройка кейса");
    }

    if (features.hasCases && (!dto.cases || dto.cases.length === 0)) {
      throw new BadRequestException("Требуется хотя бы 1 кейс");
    }

    if (!features.hasCases && !dto.dateDeadLine && features.hasLoadedSolution) {
      throw new BadRequestException("Требуется дедлайн для загрузки решения");
    }
  }

  private getAccessibleEventWhere(userId: string): Prisma.EventWhereInput {
    return {
      OR: [
        { userId },
        { organization: { ownerUserId: userId } },
        { organization: { users: { some: { userId } } } },
      ],
    };
  }

  private async ensureEventAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        idEvent: eventId,
        ...this.getAccessibleEventWhere(userId),
      },
      select: {
        idEvent: true,
        status: true,
        dataStart: true,
      },
    });

    if (!event) {
      throw new NotFoundException("Мероприятие не найдено");
    }

    return event;
  }

  private async ensureEditableEventAccess(userId: string, eventId: string) {
    const event = await this.ensureEventAccess(userId, eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException(
        "Завершенное мероприятие нельзя редактировать",
      );
    }

    if (new Date() >= event.dataStart) {
      throw new BadRequestException(
        "Мероприятие уже началось, редактирование недоступно",
      );
    }

    return event;
  }

  private async ensureMaterialsBelongToEvent(
    eventId: string,
    materialIds: string[],
    caseId: string | null,
  ) {
    if (!materialIds.length) return;

    const foundCount = await this.prisma.material.count({
      where: {
        eventId,
        caseId,
        idMaterial: {
          in: materialIds,
        },
      },
    });

    if (foundCount !== new Set(materialIds).size) {
      throw new BadRequestException("Материал не принадлежит мероприятию");
    }
  }

  private async ensureCasesBelongToEvent(eventId: string, caseIds: string[]) {
    if (!caseIds.length) return;

    const foundCount = await this.prisma.case.count({
      where: {
        eventId,
        idCase: {
          in: caseIds,
        },
      },
    });

    if (foundCount !== new Set(caseIds).size) {
      throw new BadRequestException("Кейс не принадлежит мероприятию");
    }
  }

  private async syncCaseMaterials(
    prisma: Prisma.TransactionClient,
    eventId: string,
    caseId: string,
    materials: UpdateEventCaseMaterialDto[],
  ) {
    const materialIds = materials
      .map((material) => material.idMaterial)
      .filter((id): id is string => Boolean(id));

    if (materialIds.length) {
      const foundCount = await prisma.material.count({
        where: {
          eventId,
          caseId,
          idMaterial: {
            in: materialIds,
          },
        },
      });

      if (foundCount !== new Set(materialIds).size) {
        throw new BadRequestException("Материал кейса не принадлежит кейсу");
      }
    }

    const keepIds = new Set<string>();

    for (const material of materials) {
      if (material.idMaterial) {
        keepIds.add(material.idMaterial);
        await prisma.material.update({
          where: {
            idMaterial: material.idMaterial,
          },
          data: {
            title: material.title.trim(),
            description: this.optionalString(material.description),
            url: material.url.trim(),
          },
        });
        continue;
      }

      const createdMaterial = await prisma.material.create({
        data: {
          title: material.title.trim(),
          description: this.optionalString(material.description),
          url: material.url.trim(),
          eventId,
          caseId,
        },
        select: {
          idMaterial: true,
        },
      });
      keepIds.add(createdMaterial.idMaterial);
    }

    await prisma.material.deleteMany({
      where: {
        eventId,
        caseId,
        idMaterial: {
          notIn: [...keepIds],
        },
      },
    });
  }

  private async syncCaseTags(
    prisma: Prisma.TransactionClient,
    caseId: string,
    userId: string,
    tags: EventTagInputDto[],
  ) {
    const linkedTagIds = new Set<string>();
    const uniqueTags = this.normalizeTags(tags);

    for (const input of uniqueTags) {
      const tag = input.id
        ? await this.getAvailableTag(prisma, input.id, userId)
        : await this.getOrCreateCustomTag(prisma, input.name!, userId);

      linkedTagIds.add(tag.idTag);

      await prisma.caseTag.upsert({
        where: {
          caseId_tagId: {
            caseId,
            tagId: tag.idTag,
          },
        },
        update: {},
        create: {
          caseId,
          tagId: tag.idTag,
        },
      });
    }

    await prisma.caseTag.deleteMany({
      where: {
        caseId,
        tagId: {
          notIn: [...linkedTagIds],
        },
      },
    });
  }

  private async deleteUnusedCases(
    prisma: Prisma.TransactionClient,
    eventId: string,
    keepCaseIds: string[],
  ) {
    const casesForDelete = await prisma.case.findMany({
      where: {
        eventId,
        idCase: {
          notIn: keepCaseIds,
        },
      },
      select: {
        idCase: true,
        _count: {
          select: {
            teams: true,
            solutions: true,
            results: true,
          },
        },
      },
    });

    const protectedCase = casesForDelete.find(
      (eventCase) =>
        eventCase._count.teams > 0 ||
        eventCase._count.solutions > 0 ||
        eventCase._count.results > 0,
    );

    if (protectedCase) {
      throw new BadRequestException(
        "Нельзя удалить кейс, к которому уже привязаны команды, решения или итоги",
      );
    }

    await prisma.case.deleteMany({
      where: {
        idCase: {
          in: casesForDelete.map((eventCase) => eventCase.idCase),
        },
      },
    });
  }

  private countUniqueTeamUsers(
    teams: Array<{ user: Array<{ userId: string }> }>,
  ) {
    return new Set(
      teams.flatMap((team) => team.user.map((member) => member.userId)),
    ).size;
  }

  private resolveFeatures(dto: CreateEventDto): EventFeaturePreset {
    if (this.isPresetEventType(dto.type)) {
      return EVENT_FEATURES[dto.type];
    }

    return {
      hasCases: dto.hasCases ?? false,
      hasTeams: dto.hasTeams ?? false,
      hasParticipantLimit: dto.hasParticipantLimit ?? false,
      hasLoadedSolution: dto.hasLoadedSolution ?? false,
      hasMaterials: dto.hasMaterials ?? false,
      hasResualt: dto.hasResualt ?? false,
    };
  }

  private isPresetEventType(type: string): type is CreateEventType {
    return Object.values(CreateEventType).includes(type as CreateEventType);
  }

  private async createTags(
    prisma: Prisma.TransactionClient,
    eventId: string,
    userId: string,
    tags: EventTagInputDto[],
  ) {
    const linkedTagIds = new Set<string>();
    const uniqueTags = this.normalizeTags(tags);

    for (const input of uniqueTags) {
      const tag = input.id
        ? await this.getAvailableTag(prisma, input.id, userId)
        : await this.getOrCreateCustomTag(prisma, input.name!, userId);

      if (linkedTagIds.has(tag.idTag)) continue;
      linkedTagIds.add(tag.idTag);

      await prisma.eventTag.create({
        data: {
          eventId,
          tagId: tag.idTag,
        },
      });
    }
  }

  private normalizeTags(tags: EventTagInputDto[]) {
    const unique = new Map<string, EventTagInputDto>();

    for (const tag of tags) {
      const id = tag.id?.trim();
      const name = tag.name?.trim();

      if (id) {
        unique.set(`id:${id}`, { id });
        continue;
      }

      if (name) {
        unique.set(`name:${this.toSlug(name)}`, { name });
      }
    }

    return [...unique.values()];
  }

  private async getAvailableTag(
    prisma: Prisma.TransactionClient,
    tagId: string,
    userId: string,
  ) {
    const tag = await prisma.tag.findFirst({
      where: {
        idTag: tagId,
        OR: [{ type: TagType.SYSTEM }, { type: TagType.CUSTOM, userId }],
      },
      select: { idTag: true },
    });

    if (!tag) {
      throw new BadRequestException("Тэг недоступен");
    }

    return tag;
  }

  private async getOrCreateCustomTag(
    prisma: Prisma.TransactionClient,
    tagName: string,
    userId: string,
  ) {
    const slug = this.toSlug(tagName);

    if (!slug) {
      throw new BadRequestException("Неверное имя тега");
    }

    return prisma.tag.upsert({
      where: {
        slug_userId: {
          slug,
          userId,
        },
      },
      update: {
        name: tagName,
      },
      create: {
        name: tagName,
        slug,
        type: TagType.CUSTOM,
        userId,
      },
      select: { idTag: true },
    });
  }

  private async createEventMaterials(
    prisma: Prisma.TransactionClient,
    eventId: string,
    materials: EventMaterialDto[],
  ) {
    for (const material of materials) {
      await prisma.material.create({
        data: {
          title: material.title.trim(),
          url: material.url.trim(),
          eventId,
        },
      });
    }
  }

  private async createCases(
    prisma: Prisma.TransactionClient,
    eventId: string,
    userId: string,
    dto: CreateEventDto,
    features: EventFeaturePreset,
  ) {
    if (!features.hasCases || !dto.caseSettings) return;

    for (const eventCase of dto.cases ?? []) {
      const createdCase = await prisma.case.create({
        data: {
          title: eventCase.title.trim(),
          description: this.optionalString(eventCase.description),
          holder: eventCase.holder.trim(),
          teamLimit: eventCase.teamLimit,
          dateForStartSelected: new Date(dto.caseSettings.dateForStartSelected),
          dateForEndSelected: new Date(dto.caseSettings.dateForEndSelected),
          dateStopCode: new Date(
            dto.caseSettings.dateStopCode ??
              dto.caseSettings.dateForEndSelected,
          ),
          eventId,
        },
      });

      await this.createCaseMaterials(
        prisma,
        eventId,
        createdCase.idCase,
        eventCase,
      );
      await this.createCaseTags(
        prisma,
        createdCase.idCase,
        userId,
        eventCase.tags ?? [],
      );
    }
  }

  private async createCaseMaterials(
    prisma: Prisma.TransactionClient,
    eventId: string,
    caseId: string,
    eventCase: EventCaseDto,
  ) {
    for (const material of eventCase.materials ?? []) {
      await prisma.material.create({
        data: {
          title: material.title.trim(),
          url: material.url.trim(),
          eventId,
          caseId,
        },
      });
    }
  }

  private async createCaseTags(
    prisma: Prisma.TransactionClient,
    caseId: string,
    userId: string,
    tags: EventTagInputDto[],
  ) {
    const linkedTagIds = new Set<string>();
    const uniqueTags = this.normalizeTags(tags);

    for (const input of uniqueTags) {
      const tag = input.id
        ? await this.getAvailableTag(prisma, input.id, userId)
        : await this.getOrCreateCustomTag(prisma, input.name!, userId);

      if (linkedTagIds.has(tag.idTag)) continue;
      linkedTagIds.add(tag.idTag);

      await prisma.caseTag.create({
        data: {
          caseId,
          tagId: tag.idTag,
        },
      });
    }
  }

  private optionalString(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private validateEventDateRange(start: string, end: string) {
    if (new Date(start) > new Date(end)) {
      throw new BadRequestException(
        "Р”Р°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ РјРµСЂРѕРїСЂРёСЏС‚РёСЏ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р°",
      );
    }
  }

  private validateRegistrationDateRange(start: string, end: string) {
    if (new Date(start) > new Date(end)) {
      throw new BadRequestException(
        "Р”Р°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ СЂРµРіРёСЃС‚СЂР°С†РёРё РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р° СЂРµРіРёСЃС‚СЂР°С†РёРё",
      );
    }
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
  }
}
