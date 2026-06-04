import { instance } from "@/api/axios";
import {
  EventCreateDraft,
  EventTagOption,
  OrganizationOption,
} from "@/types/event-create.types";
import {
  EventInviteResponse,
  CreateManagedEventTurniketData,
  ManagedEventAdminAccessOptions,
  ManagedEventDetails,
  ManagedEventSummary,
  ManagedEventTurniketOverview,
  UpdateManagedEventTurniketStatusData,
  UpsertManagedEventAdminAccessData,
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

  async getMyEventTurniketsOverview(eventId: string) {
    return instance.get<ManagedEventTurniketOverview>(
      `${this.baseUrl}/my/${eventId}/turnikets`,
    );
  }

  async createMyEventTurniket(
    eventId: string,
    data: CreateManagedEventTurniketData,
  ) {
    return instance.post<{
      success: boolean;
      idTurniket: string;
      overview: ManagedEventTurniketOverview;
    }>(`${this.baseUrl}/my/${eventId}/turnikets`, data);
  }

  async deleteMyEventTurniket(eventId: string, turniketId: string) {
    return instance.delete<{
      success: boolean;
      overview: ManagedEventTurniketOverview;
    }>(`${this.baseUrl}/my/${eventId}/turnikets/${turniketId}`);
  }

  async updateMyEventTurniketStatus(
    eventId: string,
    turniketId: string,
    data: UpdateManagedEventTurniketStatusData,
  ) {
    return instance.patch<{
      success: boolean;
      overview: ManagedEventTurniketOverview;
    }>(`${this.baseUrl}/my/${eventId}/turnikets/${turniketId}`, data);
  }

  async getMyEventAdminAccessOptions(eventId: string) {
    return instance.get<ManagedEventAdminAccessOptions>(
      `${this.baseUrl}/my/${eventId}/admin-access-options`,
    );
  }

  async upsertMyEventAdminAccess(
    eventId: string,
    data: UpsertManagedEventAdminAccessData,
  ) {
    return instance.post<ManagedEventAdminAccessOptions>(
      `${this.baseUrl}/my/${eventId}/admin-access`,
      data,
    );
  }

  async deleteMyEventAdminAccess(eventId: string, userId: string) {
    return instance.delete<ManagedEventAdminAccessOptions>(
      `${this.baseUrl}/my/${eventId}/admin-access/${userId}`,
    );
  }

  async transferMyEventOwnership(eventId: string, userId: string) {
    return instance.patch<ManagedEventAdminAccessOptions>(
      `${this.baseUrl}/my/${eventId}/owner`,
      { userId },
    );
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
