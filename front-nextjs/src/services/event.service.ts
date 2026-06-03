import { instance } from "@/api/axios";
import {
  EventCreateDraft,
  EventTagOption,
  OrganizationOption,
} from "@/types/event-create.types";
import {
  EventInviteResponse,
  ManagedEventDetails,
  ManagedEventSummary,
  UpdateManagedEventCasesData,
  UpdateManagedEventGeneralData,
  UpdateManagedEventMaterialsData,
  UpdateManagedEventResultsData,
  UpdateManagedEventSettingsData,
} from "@/types/event-management.types";

interface EventCreateOptionsResponse {
  organizations: OrganizationOption[];
  tags: EventTagOption[];
}

class EventService {
  private readonly baseUrl = "/events";

  async getCreateOptions() {
    return instance.get<EventCreateOptionsResponse>(
      `${this.baseUrl}/create-options`,
    );
  }

  async create(data: EventCreateDraft) {
    return instance.post(this.baseUrl, data);
  }

  async getMyEvents() {
    return instance.get<ManagedEventSummary[]>(`${this.baseUrl}/my`);
  }

  async getMyEventDetails(eventId: string) {
    return instance.get<ManagedEventDetails>(`${this.baseUrl}/my/${eventId}`);
  }

  async updateMyEventGeneral(
    eventId: string,
    data: UpdateManagedEventGeneralData,
  ) {
    return instance.patch<ManagedEventDetails>(`${this.baseUrl}/my/${eventId}`, data);
  }

  async updateMyEventSettings(
    eventId: string,
    data: UpdateManagedEventSettingsData,
  ) {
    return instance.patch<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/settings`,
      data,
    );
  }

  async updateMyEventMaterials(
    eventId: string,
    data: UpdateManagedEventMaterialsData,
  ) {
    return instance.patch<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/materials`,
      data,
    );
  }

  async updateMyEventCases(eventId: string, data: UpdateManagedEventCasesData) {
    return instance.patch<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/cases`,
      data,
    );
  }

  async updateMyEventResults(
    eventId: string,
    data: UpdateManagedEventResultsData,
  ) {
    return instance.patch<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/results`,
      data,
    );
  }

  async finishMyEvent(eventId: string) {
    return instance.patch<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/finish`,
    );
  }

  async createMyEventInvite(eventId: string) {
    return instance.post<EventInviteResponse>(
      `${this.baseUrl}/my/${eventId}/invite`,
    );
  }

  async approveMyEventJoinRequest(eventId: string, requestId: string) {
    return instance.post<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/join-requests/${requestId}/approve`,
    );
  }

  async rejectMyEventJoinRequest(eventId: string, requestId: string) {
    return instance.post<ManagedEventDetails>(
      `${this.baseUrl}/my/${eventId}/join-requests/${requestId}/reject`,
    );
  }
}

export default new EventService();
