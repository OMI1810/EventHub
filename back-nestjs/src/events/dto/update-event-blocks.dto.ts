import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { EventTagInputDto } from "./create-event.dto";

export class UpdateEventSettingsDto {
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

  @IsOptional()
  @IsInt()
  @Min(1)
  participantLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamMemberLimit?: number;

  @IsOptional()
  @IsISO8601()
  dateDeadLine?: string;
}

export class UpdateEventMaterialItemDto {
  @IsOptional()
  @IsString()
  idMaterial?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class UpdateEventMaterialsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateEventMaterialItemDto)
  materials: UpdateEventMaterialItemDto[];
}

export class UpdateEventCaseMaterialDto {
  @IsOptional()
  @IsString()
  idMaterial?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class UpdateEventCaseItemDto {
  @IsOptional()
  @IsString()
  idCase?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  holder?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamLimit?: number;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsISO8601()
  dateForStartSelected: string;

  @IsISO8601()
  dateForEndSelected: string;

  @IsISO8601()
  dateStopCode: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventTagInputDto)
  tags?: EventTagInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateEventCaseMaterialDto)
  materials?: UpdateEventCaseMaterialDto[];
}

export class UpdateEventCasesDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateEventCaseItemDto)
  cases: UpdateEventCaseItemDto[];
}

export class UpdateEventResultItemDto {
  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  place?: number | null;
}

export class UpdateEventResultsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => UpdateEventResultItemDto)
  results: UpdateEventResultItemDto[];
}
