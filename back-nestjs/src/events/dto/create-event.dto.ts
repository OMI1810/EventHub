import { EventFormat } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
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

export enum CreateEventStatus {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
}

export class CaseSettingsDto {
  @IsISO8601()
  dateForStartSelected: string;

  @IsISO8601()
  dateForEndSelected: string;

  @IsOptional()
  @IsISO8601()
  dateStopCode?: string;
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
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventTagInputDto)
  tags?: EventTagInputDto[];

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
  @IsString()
  @IsNotEmpty()
  type: string;

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

  @IsEnum(CreateEventStatus)
  status: CreateEventStatus;

  @ValidateIf((dto: CreateEventDto) => dto.status === CreateEventStatus.PUBLIC)
  @IsISO8601()
  dataStartRegistration?: string;

  @ValidateIf((dto: CreateEventDto) => dto.status === CreateEventStatus.PUBLIC)
  @IsISO8601()
  dataEndRegistration?: string;

  @ValidateIf(
    (dto: CreateEventDto) =>
      dto.type === CreateEventType.CONTEST ||
      (dto.type !== CreateEventType.HACKATHON &&
        dto.type !== CreateEventType.MASTER_CLASS &&
        dto.type !== CreateEventType.CONTEST &&
        dto.hasLoadedSolution &&
        !dto.hasCases),
  )
  @IsISO8601()
  dateDeadLine?: string;

  @IsEnum(EventFormat)
  format: EventFormat;

  @ValidateIf((dto: CreateEventDto) => dto.format !== EventFormat.ONLINE)
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventTagInputDto)
  tags?: EventTagInputDto[];

  @IsOptional()
  @IsBoolean()
  hasCases?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTeams?: boolean;

  @IsOptional()
  @IsBoolean()
  hasParticipantLimit?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLoadedSolution?: boolean;

  @IsOptional()
  @IsBoolean()
  hasMaterials?: boolean;

  @IsOptional()
  @IsBoolean()
  hasResualt?: boolean;

  @IsOptional()
  @IsBoolean()
  hasEntryPass?: boolean;

  @ValidateIf(
    (dto: CreateEventDto) =>
      dto.type !== CreateEventType.HACKATHON || dto.hasParticipantLimit,
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  participantLimit?: number;

  @ValidateIf(
    (dto: CreateEventDto) =>
      dto.type === CreateEventType.HACKATHON || dto.hasTeams,
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  teamMemberLimit?: number;

  @ValidateIf(
    (dto: CreateEventDto) =>
      dto.type === CreateEventType.HACKATHON || dto.hasCases,
  )
  @ValidateNested()
  @Type(() => CaseSettingsDto)
  caseSettings?: CaseSettingsDto;

  @ValidateIf(
    (dto: CreateEventDto) =>
      dto.type === CreateEventType.HACKATHON || dto.hasCases,
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventCaseDto)
  cases?: EventCaseDto[];

  @ValidateIf(
    (dto: CreateEventDto) =>
      dto.type !== CreateEventType.HACKATHON || dto.hasMaterials,
  )
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventMaterialDto)
  eventMaterials?: EventMaterialDto[];
}
