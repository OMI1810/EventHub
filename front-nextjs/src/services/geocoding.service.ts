import { instance } from "@/api/axios";
import {
  AddressSuggestion,
  GeocodedAddress,
} from "@/types/geocoding.types";

class GeocodingService {
  private readonly baseUrl = "/geocoding";

  async suggest(text: string) {
    return instance.get<AddressSuggestion[]>(`${this.baseUrl}/suggest`, {
      params: { text },
    });
  }

  async geocodeByMagicKey(magicKey: string) {
    return instance.get<GeocodedAddress>(`${this.baseUrl}/geocode`, {
      params: { magicKey },
    });
  }
}

export default new GeocodingService();
