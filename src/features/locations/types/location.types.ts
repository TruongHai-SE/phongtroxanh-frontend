export interface LocationSuggestionResponse {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  district?: string;
  lat?: number;
  lng?: number;
}

export interface GeocodeResponse {
  address: string;
  district: string;
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResponse {
  address: string;
  district: string;
  lat: number;
  lng: number;
}
