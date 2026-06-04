import { IsBoolean, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateEventTurniketDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}

export class UpdateEventTurniketStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export interface EventTurniketOverviewItemDto {
  idTurniket: string;
  label: string;
  login: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByAdmin: {
    idUser: string;
    email: string;
    name: string | null;
    surname: string | null;
    patronymic: string | null;
  };
  lastScannedAt: Date | null;
  stats: {
    totalScans: number;
    allowedEntries: number;
    deniedEntries: number;
    uniqueParticipants: number;
    firstSuccessfulEntries: number;
  };
}

export interface EventTurniketOverviewDto {
  canManage: boolean;
  turnikets: EventTurniketOverviewItemDto[];
  stats: {
    totalScans: number;
    allowedEntries: number;
    deniedEntries: number;
    uniqueParticipants: number;
    firstSuccessfulEntries: number;
    repeatAttempts: number;
    activeTurnikets: number;
    lastScannedAt: Date | null;
    denyBreakdown: {
      expired: number;
      replay: number;
      invalid: number;
      notEligible: number;
    };
  };
  entries: Array<{
    idEventEntryLog: string;
    scannedAt: Date;
    decision: string;
    failureReason: string | null;
    wasFirstSuccessfulEntry: boolean;
    turniketLabel: string | null;
    participantLabel: string;
    participantEmail: string;
    teamName: string | null;
    caseTitle: string | null;
  }>;
}

export interface EventTurniketMutationResultDto {
  success: true;
  idTurniket?: string;
  overview: EventTurniketOverviewDto;
}
