import { instance } from "@/api/axios";
import {
  EventCreateDraft,
  EventTagOption,
  OrganizationOption,
} from "@/types/event-create.types";

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
}

export default new EventService();
