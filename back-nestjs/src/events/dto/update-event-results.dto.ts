import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class UpdateEventResultItemDto {
  @IsOptional()
  @IsString()
  caseId?: string | null;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @ValidateIf((dto: UpdateEventResultItemDto) => dto.place !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  place?: number | null;
}

export class UpdateEventResultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEventResultItemDto)
  results: UpdateEventResultItemDto[];
}
