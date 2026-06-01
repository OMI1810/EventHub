import {
  EventFormat,
  EventPublicationStatus,
  EventTagDraft,
  EventTagOption,
} from "./event-create.types";

export type ManagedEventStatus =
  | "FINISHED"
  | "OPEN"
  | "PUBLISHED"
  | "PRIVATE"
  | "OPEN_REGISTRATION"
  | "CLOSED_REGISTRATION";

export interface ManagedEventOrganization {
  idOrganization: string;
  name: string;
}

export interface ManagedEventSummary {
  idEvent: string;
  title: string;
  type: string;
  status: ManagedEventStatus;
  format: EventFormat;
  dataStart: string;
  dataEnd: string;
  dataStartRegistration?: string | null;
  dataEndRegistration?: string | null;
  hasCases: boolean;
  hasTeams: boolean;
  hasMaterials: boolean;
  hasLoadedSolution: boolean;
  hasResualt: boolean;
  organization: ManagedEventOrganization;
  registeredUsersCount: number;
}

export interface ManagedEventTeam {
  idTeam: string;
  name: string;
  description?: string | null;
  format: string;
  caseId?: string | null;
  membersCount: number;
  caption: {
    idUser: string;
    email: string;
    name?: string | null;
    surname?: string | null;
  };
  members: Array<{
    role?: string | null;
    user: {
      idUser: string;
      name?: string | null;
      surname?: string | null;
      patronymic?: string | null;
    };
  }>;
}

export interface ManagedEventCase {
  idCase: string;
  title: string;
  description?: string | null;
  holder?: string | null;
  teamLimit?: number | null;
  isOpen: boolean;
  dateForStartSelected: string;
  dateForEndSelected: string;
  dateStopCode: string;
  materials: Array<{
    idMaterial: string;
    title: string;
    url: string;
  }>;
  tags: EventTagOption[];
}

export interface ManagedEventMaterial {
  idMaterial: string;
  title: string;
  url: string;
}

export interface ManagedEventParticipant {
  createAt: string;
  user: {
    idUser: string;
    name?: string | null;
    surname?: string | null;
    patronymic?: string | null;
  };
}

export interface ManagedEventDetails extends ManagedEventSummary {
  description?: string | null;
  slug: string;
  address: string;
  cordinatX?: number | null;
  cordinatY?: number | null;
  dateDeadLine?: string | null;
  hasParticipantLimit: boolean;
  participantLimit?: number | null;
  participanInTeamLimit?: number | null;
  teams: ManagedEventTeam[];
  participant: ManagedEventParticipant[];
  cases: ManagedEventCase[];
  materials: ManagedEventMaterial[];
}

export interface UpdateManagedEventGeneralData {
  title: string;
  description?: string;
  slug: string;
  dataStart: string;
  dataEnd: string;
  status: EventPublicationStatus;
  dataStartRegistration?: string;
  dataEndRegistration?: string;
  format: EventFormat;
  address: string;
  cordinatX?: number;
  cordinatY?: number;
}

export interface EventInviteResponse {
  code: string;
  expiresAt: string;
}

export interface UpdateManagedEventSettingsData {
  hasCases?: boolean;
  hasTeams?: boolean;
  hasParticipantLimit?: boolean;
  hasLoadedSolution?: boolean;
  hasMaterials?: boolean;
  hasResualt?: boolean;
  participantLimit?: number;
  teamMemberLimit?: number;
  dateDeadLine?: string;
}

export interface UpdateManagedEventMaterialData {
  idMaterial?: string;
  title: string;
  description?: string;
  url: string;
}

export interface UpdateManagedEventMaterialsData {
  materials: UpdateManagedEventMaterialData[];
}

export interface UpdateManagedEventCaseMaterialData {
  idMaterial?: string;
  title: string;
  description?: string;
  url: string;
}

export interface UpdateManagedEventCaseData {
  idCase?: string;
  title: string;
  description?: string;
  holder?: string;
  teamLimit?: number;
  isOpen?: boolean;
  dateForStartSelected: string;
  dateForEndSelected: string;
  dateStopCode: string;
  tags?: EventTagDraft[];
  materials?: UpdateManagedEventCaseMaterialData[];
}

export interface UpdateManagedEventCasesData {
  cases: UpdateManagedEventCaseData[];
}
