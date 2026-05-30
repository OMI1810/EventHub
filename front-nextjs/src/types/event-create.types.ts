export type EventCreateType = "HACKATHON" | "MASTER_CLASS" | "CONTEST";

export type EventFormat = "OFFLINE" | "ONLINE" | "HYBRID";

export type EventPublicationStatus = "PRIVATE" | "PUBLIC";

export type EventTagType = "SYSTEM" | "CUSTOM";

export interface EventFeaturePreset {
  hasCases: boolean;
  hasTeams: boolean;
  hasParticipantLimit: boolean;
  hasLoadedSolution: boolean;
  hasMaterials: boolean;
  hasResualt: boolean;
}

export interface OrganizationOption {
  idOrganization: string;
  name: string;
}

export interface EventTagOption {
  idTag: string;
  name: string;
  type: EventTagType;
}

export interface EventTagDraft {
  id?: string;
  name: string;
}

export interface EventCaseMaterialDraft {
  id?: string;
  title: string;
  url: string;
}

export interface EventCaseDraft {
  id: string;
  holder: string;
  title: string;
  description?: string;
  teamLimit?: number;
  materials: EventCaseMaterialDraft[];
}

export interface EventMaterialDraft {
  id: string;
  title: string;
  url: string;
}

export interface EventCreateDraft {
  type: string;
  title: string;
  description?: string;
  slug: string;
  organizationId: string;
  dataStart: string;
  dataEnd: string;
  status: EventPublicationStatus;
  dataStartRegistration?: string;
  dataEndRegistration?: string;
  dateDeadLine?: string;
  format: EventFormat;
  address: string;
  cordinatX?: number;
  cordinatY?: number;
  tags: EventTagDraft[];
  hasCases?: boolean;
  hasTeams?: boolean;
  hasParticipantLimit?: boolean;
  hasLoadedSolution?: boolean;
  hasMaterials?: boolean;
  hasResualt?: boolean;
  participantLimit?: number;
  teamMemberLimit?: number;
  caseSettings?: {
    dateForStartSelected: string;
    dateForEndSelected: string;
    dateStopCode?: string;
  };
  cases?: Omit<EventCaseDraft, "id">[];
  eventMaterials?: Omit<EventMaterialDraft, "id">[];
}
