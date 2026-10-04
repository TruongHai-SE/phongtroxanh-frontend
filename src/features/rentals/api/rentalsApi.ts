import { api } from "@/lib/api";
import type {
  CreateRentalRequest,
  RentalResponse,
} from "../types/rental.types";

export const rentalsApi = {
  // #53 POST /rentals
  createRental: (body: CreateRentalRequest): Promise<RentalResponse> => {
    return api.post<RentalResponse>("/rentals", body);
  },

  // #54 GET /rentals/tenant/me
  getMyTenantRentals: (): Promise<RentalResponse[]> => {
    return api.get<RentalResponse[]>("/rentals/tenant/me");
  },

  // #55 GET /rentals/landlord/me
  getMyLandlordRentals: (): Promise<RentalResponse[]> => {
    return api.get<RentalResponse[]>("/rentals/landlord/me");
  },

  // Backwards compatibility alias
  getMyRentals: (): Promise<RentalResponse[]> => {
    return api.get<RentalResponse[]>("/rentals/landlord/me");
  },

  // #56 GET /rentals/{id}
  getRentalById: (id: string): Promise<RentalResponse> => {
    return api.get<RentalResponse>(`/rentals/${id}`);
  },

  // #57 GET /rentals/{id}/check-in-qr
  getCheckInQr: (id: string): Promise<{ qrToken: string; code: string; expiresInSeconds: number }> => {
    return api.get<any>(`/rentals/${id}/check-in-qr`);
  },

  // #58 POST /rentals/{id}/check-in
  verifyCheckIn: (id: string, body?: { checkInCode?: string; code?: string; qrToken?: string }): Promise<RentalResponse> => {
    const code = body?.checkInCode || body?.code || "CONFIRM";
    return api.post<RentalResponse>(`/rentals/${id}/check-in`, { checkInCode: code });
  },

  // #59 POST /rentals/{id}/terminate
  terminateRental: (id: string): Promise<RentalResponse> => {
    return api.post<RentalResponse>(`/rentals/${id}/terminate`);
  },
};

