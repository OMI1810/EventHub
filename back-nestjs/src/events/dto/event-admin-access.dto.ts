import { IsBoolean, IsOptional, IsString } from "class-validator";

export class EventAdminPermissionsDto {
  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @IsOptional()
  @IsBoolean()
  canEditGeneral?: boolean;

  @IsOptional()
  @IsBoolean()
  canEditSettings?: boolean;

  @IsOptional()
  @IsBoolean()
  canEditMaterials?: boolean;

  @IsOptional()
  @IsBoolean()
  canEditCases?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewParticipants?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewTeams?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewSolutions?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewResults?: boolean;

  @IsOptional()
  @IsBoolean()
  canEditResults?: boolean;

  @IsOptional()
  @IsBoolean()
  canDeleteResults?: boolean;

  @IsOptional()
  @IsBoolean()
  canFinishEvent?: boolean;

  @IsOptional()
  @IsBoolean()
  canExportCsv?: boolean;

  @IsOptional()
  @IsBoolean()
  canManagePrivateInvites?: boolean;
}

export class UpsertEventAdminAccessDto extends EventAdminPermissionsDto {
  @IsString()
  userId: string;
}

export class TransferEventOwnershipDto {
  @IsString()
  userId: string;
}
