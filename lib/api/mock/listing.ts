/**
 * Mock of the Public Listing API, built from the rooms content: the same DTOs the real
 * `/public/buildings/{slug}/*` endpoints return, so the mock and the real backend go through
 * the same adapter (lib/api/listing/adapter.ts).
 */
import type { RoomsContent } from "../listing/adapter";
import type { BuildingListing, PublicRoomListItemDto, PublicRoomTypeDto } from "../listing/types";
import type { TierId } from "../types";

const APPLIANCES = new Set(["fridge", "washer", "microwave", "purifier", "tv"]);

export function mockListing(c: RoomsContent): BuildingListing {
  const tierById = new Map(c.tiers.map((t) => [t.id, t]));
  const rooms: PublicRoomListItemDto[] = c.floors.flatMap((f) =>
    [...f.north, ...f.south].flatMap((u) => {
      if (u.tier === "core") return [];
      const t = tierById.get(u.tier)!;
      return [
        {
          roomNumber: u.id,
          floor: f.level,
          roomTypeCode: c.roomTypeCodes[u.tier],
          roomTypeName: t.name,
          areaSqm: t.area,
          maxOccupants: t.sleeps,
          monthlyRent: t.price,
          availability: u.status === "available" ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
        },
      ];
    }),
  );
  rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));

  const roomTypes: PublicRoomTypeDto[] = c.tiers
    .map((t) => {
      const mine = rooms.filter((r) => r.roomTypeCode === c.roomTypeCodes[t.id as TierId]);
      return {
        code: c.roomTypeCodes[t.id],
        name: t.name,
        baseMonthlyRent: t.price,
        standardAreaSqm: t.area,
        maxOccupants: t.sleeps,
        totalRooms: mine.length,
        availableRooms: mine.filter((r) => r.availability === "AVAILABLE").length,
      };
    })
    .sort((a, b) => a.baseMonthlyRent - b.baseMonthlyRent);

  return {
    building: {
      slug: "atrium",
      name: "Atrium",
      description: null,
      addressLine: "12 Example Street",
      ward: "Ward 6",
      district: "District 3",
      city: "Ho Chi Minh City",
      totalRooms: rooms.length,
      availableRooms: rooms.filter((r) => r.availability === "AVAILABLE").length,
      floors: [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b),
      roomTypes,
      utilities: { electricityBillingMode: "EVN_TIERED_QUOTA", waterRatePerM3: 25_000 },
      depositMonths: 1,
    },
    rooms,
    assets: c.addons.map((a) => ({
      name: a.name,
      category: APPLIANCES.has(a.id) ? "APPLIANCE" : "FURNITURE",
      standardMonthlyRentalFee: a.price,
      roomsEquipped: 0,
    })),
  };
}
