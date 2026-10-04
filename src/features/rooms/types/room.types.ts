export interface LandlordInfo {
  id?: string;
  name?: string;
  fullName?: string;
  verified?: boolean;
  isVerified?: boolean;
  avatar?: string;
  avatarUrl?: string;
  rating?: number;
  trustScore?: number;
  phone?: string;
}

export interface FeeItem {
  label: string;
  value: string;
}

export interface Room {
  id: string;
  title: string;
  price: number;
  district: string;
  address?: string;
  area: number;
  floor: number;
  type: string;
  match?: number;
  amenities: string[];
  images: string[];
  landlord: LandlordInfo;
  description: string;
  fees: FeeItem[];
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  status?: "AVAILABLE" | "RENTED" | "HIDDEN" | "PENDING" | "EXPIRED";
  viewCount?: number;
  createdAt?: string;
  expiresAt?: string;
}

export interface RoomSummaryResponse {
  id: string;
  title: string;
  price: number;
  district: string;
  address?: string;
  area: number;
  floor: number;
  type: string;
  match?: number;
  amenities: string[];
  images: string[];
  landlord: LandlordInfo;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  status?: "AVAILABLE" | "RENTED" | "HIDDEN" | "PENDING" | "EXPIRED";
  createdAt?: string;
  expiresAt?: string;
}

export interface RoomDetailResponse extends RoomSummaryResponse {
  description: string;
  fees: FeeItem[];
  isSaved?: boolean;
  depositAmount?: number;
  areaSqm?: number;
  floorNumber?: number;
  roomType?: string;
}

export interface RoomFilterParams {
  page?: number;
  size?: number;
  limit?: number;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  type?: string;
  keyword?: string;
  amenities?: string[];
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
  sortBy?: string;
  query?: string;
  excludeSwiped?: boolean;
}

export interface CreateRoomRequest {
  title: string;
  description: string;
  price: number;
  area: number;
  floor?: number;
  type: string;
  roomType?: string;
  district: string;
  address: string;
  addressStreet?: string;
  depositAmount?: number;
  areaSqm?: number;
  lat: number;
  lng: number;
  amenities: string[];
  fees?: FeeItem[];
  images?: string[];
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {}

export interface UpdateRoomStatusRequest {
  status: "AVAILABLE" | "RENTED" | "HIDDEN";
}

export interface MapBoundsParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  district?: string;
}

export interface RoomMapMarkerResponse {
  id: string;
  title: string;
  price: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  district?: string;
  type?: string;
  roomType?: string;
  image?: string;
  primaryImageUrl?: string;
  areaSqm?: number;
  area?: number;
  isBoosted?: boolean;
}

export interface CompareRoomsRequest {
  roomIds: string[];
}

export interface RoomComparisonResponse {
  rooms: RoomDetailResponse[];
  highlightDifferences: Record<string, any>;
}

export interface RoomReviewResponse {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  valueRating?: number;
  comment: string;
  photos?: string[];
  createdAt: string;
}

export interface LandlordAnalyticsResponse {
  totalRooms: number;
  activeRooms: number;
  occupiedRooms: number;
  monthlyRevenue: number;
  totalViews: number;
  inquiriesCount: number;
  revenueChart: Array<{ month: string; revenue: number }>;
}
