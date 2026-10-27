/**
 * Public Listing API (docs/04-Swagger-API.md §1.5, tag "Public Listing"): read-only, no sign-in.
 * Shapes copied from the OpenAPI components (Public*Dto, StandardSuccessEnvelope, Rfc7807ErrorEnvelope).
 */

export type Availability = "AVAILABLE" | "UNAVAILABLE";
export type AssetCategory = "APPLIANCE" | "FURNITURE";
export type ConditionGrade = "GRADE_A_NEW" | "GRADE_B_GOOD" | "GRADE_C_FAIR" | "BROKEN";

export type PublicBuildingSummaryDto = {
  slug: string;
  name: string;
  district: string;
  city: string;
  totalRooms: number;
  availableRooms: number;
  monthlyRentFrom: number | null;
  monthlyRentTo: number | null;
};

export type PublicRoomTypeDto = {
  code: string;
  name: string;
  baseMonthlyRent: number;
  standardAreaSqm: number;
  maxOccupants: number;
  totalRooms: number;
  availableRooms: number;
};

export type PublicBuildingDto = {
  slug: string;
  name: string;
  description: string | null;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  totalRooms: number;
  availableRooms: number;
  floors: number[];
  roomTypes: PublicRoomTypeDto[];
  utilities: { electricityBillingMode: "EVN_TIERED_QUOTA" | "EVN_TIER_3_FLAT"; waterRatePerM3: number };
  depositMonths: number;
};

export type PublicFloorDto = { floor: number; totalRooms: number; availableRooms: number; roomNumbers: string[] };

export type PublicRoomListItemDto = {
  roomNumber: string;
  floor: number;
  roomTypeCode: string;
  roomTypeName: string;
  areaSqm: number;
  maxOccupants: number;
  monthlyRent: number;
  availability: Availability;
};

export type PublicRoomDetailDto = PublicRoomListItemDto & {
  buildingSlug: string;
  equipment: { name: string; category: AssetCategory; conditionGrade: ConditionGrade; monthlyFee: number }[];
  depositMonths: number;
};

export type PublicVacancyDto = { roomTypeCode: string; roomTypeName: string; baseMonthlyRent: number; totalRooms: number; availableRooms: number };

export type PublicAssetDto = { name: string; category: AssetCategory; standardMonthlyRentalFee: number; roomsEquipped: number };

export type RoomSearchQuery = Partial<{
  roomType: string;
  floor: number;
  availability: Availability;
  minPrice: number;
  maxPrice: number;
  minAreaSqm: number;
  occupants: number;
  sortBy: "monthlyRent" | "floor" | "roomNumber" | "areaSqm";
  sortOrder: "ASC" | "DESC";
  page: number;
  limit: number; // ≤ 50
}>;

/* ------------------------------------------------------------ envelopes */

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

export type SuccessEnvelope<T> = {
  success: true;
  statusCode: number;
  data: T;
  meta: { traceId: string; timestamp: string; durationMs: number; pagination?: PaginationMeta | null };
};

export type ErrorEnvelope = {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: { field?: string; issue?: string; message?: string }[] | null;
  traceId: string;
  timestamp: string;
  path: string;
};

/** Everything the rooms pages need from one building, fetched together. */
export type BuildingListing = {
  building: PublicBuildingDto;
  rooms: PublicRoomListItemDto[];
  assets: PublicAssetDto[];
};
