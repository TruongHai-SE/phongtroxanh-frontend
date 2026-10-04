export interface RentalResponse {
  id: string;
  roomId: string;
  roomTitle: string;
  roomAddress?: string;
  roomDistrict?: string;
  roomImage?: string;
  landlordId: string;
  landlordName: string;
  landlordPhone?: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  depositAmount: number;
  status: "PENDING_CHECKIN" | "CHECKED_IN" | "TERMINATED" | "CANCELLED" | "ACTIVE" | "EXPIRED" | "PENDING";
  checkedIn?: boolean;
  checkInAt?: string;
  createdAt: string;
}

export interface CreateRentalRequest {
  roomId: string;
  startDate: string;
  endDate: string;
  tenantId?: string;
  monthlyRent?: number;
  depositAmount?: number;
  message?: string;
}

export interface UpdateRentalStatusRequest {
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
}

export interface CheckInItem {
  name: string;
  condition: "GOOD" | "DAMAGED" | "MISSING";
  notes?: string;
  photoUrl?: string;
}

export interface CheckInSubmissionRequest {
  items: CheckInItem[];
  overallNote?: string;
  signature?: string;
}

export interface CheckInReportResponse {
  id: string;
  rentalId: string;
  submittedAt: string;
  status: "CONFIRMED" | "DISPUTED";
  items: CheckInItem[];
  overallNote?: string;
}
