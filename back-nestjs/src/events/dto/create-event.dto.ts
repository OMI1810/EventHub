import { EventFormat } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export enum CreateEventType {
  HACKATHON = "HACKATHON",
  MASTER_CLASS = "MASTER_CLASS",
  CONTEST = "CONTEST",
}

export class CaseSettingsDto {
  @IsISO8601()
  dateForStartSelected: string;

  @IsISO8601()
  dateForEndSelected: string;

  @IsISO8601()
  dateStopCode: string;
}

export class EventCaseMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class EventCaseDto {
  @IsString()
  @IsNotEmpty()
  holder: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamLimit?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventCaseMaterialDto)
  materials?: EventCaseMaterialDto[];
}

export class EventMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class EventTagInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateEventDto {
  @IsEnum(CreateEventType)
  type: CreateEventType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsISO8601()
  dataStart: string;

  @IsISO8601()
  dataEnd: string;

  @ValidateIf((dto: CreateEventDto) => dto.type === CreateEventType.CONTEST)
  @IsISO8601()
  dateDeadLine?: string;

  @IsEnum(EventFormat)
  format: EventFormat;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventTagInputDto)
  tags?: EventTagInputDto[];

  @ValidateIf((dto: CreateEventDto) => dto.type !== CreateEventType.HACKATHON)
  @IsOptional()
  @IsInt()
  @Min(1)
  participantLimit?: number;

  @ValidateIf((dto: CreateEventDto) => dto.type === CreateEventType.HACKATHON)
  @IsOptional()
  @IsInt()
  @Min(1)
  teamMemberLimit?: number;

  @ValidateIf((dto: CreateEventDto) => dto.type === CreateEventType.HACKATHON)
  @ValidateNested()
  @Type(() => CaseSettingsDto)
  caseSettings?: CaseSettingsDto;

  @ValidateIf((dto: CreateEventDto) => dto.type === CreateEventType.HACKATHON)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventCaseDto)
  cases?: EventCaseDto[];

  @ValidateIf((dto: CreateEventDto) => dto.type !== CreateEventType.HACKATHON)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventMaterialDto)
  eventMaterials?: EventMaterialDto[];
}
