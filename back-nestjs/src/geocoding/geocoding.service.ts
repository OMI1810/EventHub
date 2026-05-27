import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import {
  AddressSuggestion,
  ArcGisFindAddressesResponse,
  ArcGisSuggestResponse,
  GeocodedAddress,
} from "./geocoding.types";

const ARCGIS_GEOCODE_URL =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

@Injectable()
export class GeocodingService {
  constructor(private readonly configService: ConfigService) {}

  async suggest(text: string): Promise<AddressSuggestion[]> {
    const response = await axios.get<ArcGisSuggestResponse>(
      `${ARCGIS_GEOCODE_URL}/suggest`,
      {
        params: {
          f: "json",
          text,
          token: this.getApiKey(),
          maxSuggestions: 8,
        },
      },
    );

    return (response.data.suggestions ?? [])
      .filter((suggestion) => suggestion.text && suggestion.magicKey)
      .map((suggestion) => ({
        text: suggestion.text!,
        magicKey: suggestion.magicKey!,
      }));
  }

  async geocodeByMagicKey(magicKey: string): Promise<GeocodedAddress> {
    const response = await axios.get<ArcGisFindAddressesResponse>(
      `${ARCGIS_GEOCODE_URL}/findAddressCandidates`,
      {
        params: {
          f: "json",
          magicKey,
          token: this.getApiKey(),
          maxLocations: 1,
          outFields: "Match_addr",
        },
      },
    );

    const candidate = response.data.candidates?.[0];
    const cordinatX = candidate?.location?.x;
    const cordinatY = candidate?.location?.y;

    if (
      !candidate?.address ||
      cordinatX === undefined ||
      cordinatY === undefined
    ) {
      throw new BadRequestException("Адрес не был геокодирован");
    }

    return {
      address: candidate.address,
      cordinatX,
      cordinatY,
    };
  }

  private getApiKey() {
    const apiKey = this.configService.get<string>("ARC_GIS_API_KEY");

    if (!apiKey) {
      throw new BadRequestException("Ключ ArcGIS API не настроен");
    }

    return apiKey;
  }
}
