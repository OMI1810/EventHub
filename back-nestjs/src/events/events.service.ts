import { PrismaService } from "@/prisma.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { EventFormat, EventStatus, Prisma, Role, TagType } from "@prisma/client";
import {
  CreateEventDto,
  CreateEventStatus,
  CreateEventType,
  EventCaseDto,
  EventMaterialDto,
  EventTagInputDto,
} from "./dto/create-event.dto";

interface EventFeaturePreset {
  hasCases: boolean;
  hasTeams: boolean;
  hasParticipantLimit: boolean;
  hasLoadedSolution: boolean;
  hasMaterials: boolean;
  hasResualt: boolean;
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
  constructor(private readonly prisma: PrismaService) {}

  async getCreateOptions(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        OR: [{ ownerUserId: userId }, { users: { some: { userId } } }],
      },
      select: {
        idOrganization: true,
        name: true,
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
      await this.createCases(prisma, event.idEvent, dto, features);

      return event;
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

  private optionalString(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
  }
}
