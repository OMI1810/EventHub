import { Auth } from "@/auth/decorators/auth.decorator";
import { CurrentUser } from "@/auth/decorators/user.decorator";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
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
