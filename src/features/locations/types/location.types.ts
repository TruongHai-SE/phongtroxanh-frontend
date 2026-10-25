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
  address?: string;
  formattedAddress?: string;
  district?: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
}

export interface ReverseGeocodeResponse {
  address?: string;
  formattedAddress?: string;
  district?: string;
  lat?: number;
  lng?: number;
}
