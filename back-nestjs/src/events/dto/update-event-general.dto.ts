import { EventFormat } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { CreateEventStatus } from "./create-event.dto";

export class UpdateEventGeneralDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsISO8601()
  dataStart: string;

  @IsISO8601()
  dataEnd: string;

  @IsEnum(CreateEventStatus)
  status: CreateEventStatus;

  @ValidateIf(
    (dto: UpdateEventGeneralDto) => dto.status === CreateEventStatus.PUBLIC,
  )
  @IsISO8601()
  dataStartRegistration?: string;

  @ValidateIf(
    (dto: UpdateEventGeneralDto) => dto.status === CreateEventStatus.PUBLIC,
  )
  @IsISO8601()
  dataEndRegistration?: string;

  @IsEnum(EventFormat)
  format: EventFormat;

  @ValidateIf((dto: UpdateEventGeneralDto) => dto.format !== EventFormat.ONLINE)
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cordinatX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cordinatY?: number;
}
