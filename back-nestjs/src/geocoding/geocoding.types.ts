export interface AddressSuggestion {
  text: string;
  magicKey: string;
}

export interface GeocodedAddress {
  address: string;
  cordinatX: number;
  cordinatY: number;
}

export interface ArcGisSuggestResponse {
  suggestions?: Array<{
    text?: string;
    magicKey?: string;
  }>;
}

export interface ArcGisFindAddressCandidatesResponse {
  candidates?: Array<{
    address?: string;
    location?: {
      x?: number;
      y?: number;
    };
  }>;
}
