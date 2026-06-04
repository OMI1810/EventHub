import { Auth } from "@/auth/decorators/auth.decorator";
import { CurrentUser } from "@/auth/decorators/user.decorator";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Delete,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
import {
  CreateEventTurniketDto,
  EventTurniketMutationResultDto,
  EventTurniketOverviewDto,
  UpdateEventTurniketStatusDto,
} from "./dto/event-turniket.dto";
import {
  TransferEventOwnershipDto,
  UpsertEventAdminAccessDto,
} from "./dto/event-admin-access.dto";
import {
  UpdateEventCasesDto,
  UpdateEventMaterialsDto,
  UpdateEventSettingsDto,
} from "./dto/update-event-blocks.dto";
import { UpdateEventGeneralDto } from "./dto/update-event-general.dto";
import { UpdateEventResultsDto } from "./dto/update-event-results.dto";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Auth()
  @Get("create-options")
  async getCreateOptions(@CurrentUser("idUser") userId: string) {
    return this.eventsService.getCreateOptions(userId);
  }

  @Auth()
  @Get("my")
  async getMyEvents(@CurrentUser("idUser") userId: string) {
    return this.eventsService.getMyEvents(userId);
  }

  @Auth()
  @Get("my/:eventId")
  async getMyEventDetails(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
  ) {
    return this.eventsService.getMyEventDetails(userId, eventId);
  }

  @Auth()
  @Get("my/:eventId/turnikets")
  async getMyEventTurniketsOverview(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
  ): Promise<EventTurniketOverviewDto> {
    return this.eventsService.getMyEventTurniketsOverview(userId, eventId);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(201)
  @Post("my/:eventId/turnikets")
  async createMyEventTurniket(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: CreateEventTurniketDto,
  ): Promise<EventTurniketMutationResultDto> {
    return this.eventsService.createMyEventTurniket(userId, eventId, dto);
  }

  @Auth()
  @HttpCode(200)
  @Delete("my/:eventId/turnikets/:turniketId")
  async deleteMyEventTurniket(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Param("turniketId") turniketId: string,
  ): Promise<EventTurniketMutationResultDto> {
    return this.eventsService.deleteMyEventTurniket(userId, eventId, turniketId);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId/turnikets/:turniketId")
  async updateMyEventTurniketStatus(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Param("turniketId") turniketId: string,
    @Body() dto: UpdateEventTurniketStatusDto,
  ): Promise<EventTurniketMutationResultDto> {
    return this.eventsService.updateMyEventTurniketStatus(
      userId,
      eventId,
      turniketId,
      dto,
    );
  }

  @Auth()
  @Get("my/:eventId/admin-access-options")
  async getMyEventAdminAccessOptions(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
  ) {
    return this.eventsService.getMyEventAdminAccessOptions(userId, eventId);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Post("my/:eventId/admin-access")
  async upsertMyEventAdminAccess(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpsertEventAdminAccessDto,
  ) {
    return this.eventsService.upsertMyEventAdminAccess(userId, eventId, dto);
  }

  @Auth()
  @HttpCode(200)
  @Delete("my/:eventId/admin-access/:targetUserId")
  async deleteMyEventAdminAccess(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Param("targetUserId") targetUserId: string,
  ) {
    return this.eventsService.deleteMyEventAdminAccess(
      userId,
      eventId,
      targetUserId,
    );
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId/owner")
  async transferMyEventOwnership(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: TransferEventOwnershipDto,
  ) {
    return this.eventsService.transferMyEventOwnership(userId, eventId, dto);
  }

  @Auth()
  @HttpCode(200)
  @Post("my/:eventId/invite")
  async createMyEventInvite(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
  ) {
    return this.eventsService.createMyEventInvite(userId, eventId);
  }

  @Auth()
  @HttpCode(200)
  @Post("my/:eventId/join-requests/:requestId/approve")
  async approveMyEventJoinRequest(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Param("requestId") requestId: string,
  ) {
    return this.eventsService.approveMyEventJoinRequest(userId, eventId, requestId);
  }

  @Auth()
  @HttpCode(200)
  @Post("my/:eventId/join-requests/:requestId/reject")
  async rejectMyEventJoinRequest(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Param("requestId") requestId: string,
  ) {
    return this.eventsService.rejectMyEventJoinRequest(userId, eventId, requestId);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId")
  async updateMyEventGeneral(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventGeneralDto,
  ) {
    return this.eventsService.updateMyEventGeneral(userId, eventId, dto);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId/settings")
  async updateMyEventSettings(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventSettingsDto,
  ) {
    return this.eventsService.updateMyEventSettings(userId, eventId, dto);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId/materials")
  async updateMyEventMaterials(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventMaterialsDto,
  ) {
    return this.eventsService.updateMyEventMaterials(userId, eventId, dto);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId/cases")
  async updateMyEventCases(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventCasesDto,
  ) {
    return this.eventsService.updateMyEventCases(userId, eventId, dto);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @Patch("my/:eventId/results")
  async updateMyEventResults(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventResultsDto,
  ) {
    return this.eventsService.updateMyEventResults(userId, eventId, dto);
  }

  @Auth()
  @HttpCode(200)
  @Patch("my/:eventId/finish")
  async finishMyEvent(
    @CurrentUser("idUser") userId: string,
    @Param("eventId") eventId: string,
  ) {
    return this.eventsService.finishMyEvent(userId, eventId);
  }

  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(201)
  @Post()
  async create(
    @CurrentUser("idUser") userId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(userId, dto);
  }
}
