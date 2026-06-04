import {
  EventFormat,
  EventPublicationStatus,
  EventTagDraft,
  EventTagOption,
} from "./event-create.types";

export type ManagedEventStatus =
  | "FINISHED"
  | "PUBLISHED"
  | "PRIVATE";

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

export interface ManagedEventSolution {
  idSolution: string;
  urlSolution: string;
  urlPresentation: string;
  description?: string | null;
  createdAt: string;
  updateAt: string;
  eventId: string;
  caseId?: string | null;
  teamId?: string | null;
  userId?: string | null;
}

export interface ManagedEventTeam {
  idTeam: string;
  name: string;
  description?: string | null;
  format: string;
  caseId?: string | null;
  latestSolution?: ManagedEventSolution | null;
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
  caseId?: string | null;
  latestSolution?: ManagedEventSolution | null;
  user: {
    idUser: string;
    name?: string | null;
    surname?: string | null;
    patronymic?: string | null;
  };
}

export interface ManagedEventResult {
  idResult: string;
  title: string;
  place: number;
  description?: string | null;
  score?: number | null;
  caseId?: string | null;
  teamId?: string | null;
  userId?: string | null;
}

export interface ManagedEventSolution {
  idSolution: string;
  urlSolution: string;
  urlPresentation: string;
  description?: string | null;
  updateAt: string;
}

export interface ManagedEventJoinRequest {
  idJoinEvent: string;
  status: "PENDING" | "ACCEPT" | "REJECTED" | "CANCELED";
  user: {
    idUser: string;
    email: string;
    phone?: string | null;
    contact?: string | null;
    name?: string | null;
    surname?: string | null;
    patronymic?: string | null;
  };
}

export interface ManagedEventAdminPermissions {
  canView: boolean;
  canEditGeneral: boolean;
  canEditSettings: boolean;
  canEditMaterials: boolean;
  canEditCases: boolean;
  canViewParticipants: boolean;
  canViewTeams: boolean;
  canViewSolutions: boolean;
  canViewResults: boolean;
  canEditResults: boolean;
  canDeleteResults: boolean;
  canFinishEvent: boolean;
  canExportCsv: boolean;
}

export interface ManagedEventPermissionSnapshot
  extends ManagedEventAdminPermissions {
  hasFullAccess: boolean;
}

export interface ManagedEventAdminUser {
  idUser: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  patronymic?: string | null;
}

export interface ManagedEventAdminAccess extends ManagedEventAdminPermissions {
  idAccess: string;
  eventId: string;
  userId: string;
  user: ManagedEventAdminUser;
}

export interface ManagedEventAdminAccessOptions {
  candidates: ManagedEventAdminUser[];
  access: ManagedEventAdminAccess[];
  presets: {
    expert: ManagedEventAdminPermissions;
  };
}

export interface UpsertManagedEventAdminAccessData
  extends Partial<ManagedEventAdminPermissions> {
  userId: string;
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
  results: ManagedEventResult[];
  joinRequest: ManagedEventJoinRequest[];
  permissions: ManagedEventPermissionSnapshot;
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

export interface UpdateManagedEventResultItemData {
  caseId?: string | null;
  teamId?: string;
  userId?: string;
  place?: number | null;
}

export interface UpdateManagedEventResultsData {
  results: UpdateManagedEventResultItemData[];
}
