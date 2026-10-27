/**
 * Public Listing API → RoomsData. The API owns what changes (room types, prices, which rooms exist,
 * availability, equipment, deposit); the site's content owns what it can't know (copy, photos,
 * features, where each room sits on the floor plan, fixed fees, steps, FAQs).
 */
import { fmt } from "../../../i18n/config";
import type { Addon, AddonId, Floor, RoomsData, Status, Tier, TierId, Unit } from "../types";
import type { BuildingListing, PublicRoomListItemDto } from "./types";

export type RoomsContent = RoomsData & {
  /** API room type code for each room type the drawings know (codes are compared case-insensitively). */
  roomTypeCodes: Record<TierId, string>;
  /** Catalogue names (any language) that mean this add-on, e.g. { fridge: ["Fridge", "Tủ lạnh"] }. */
  assetNames: Record<AddonId, string[]>;
  /** How this locale names levels: "Level {n}", "Levels {from}–{to}". */
  labels: { level: string; levels: string };
};

const key = (s: string) => s.trim().toUpperCase();
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// the public API only says AVAILABLE or UNAVAILABLE (never why), so nothing shows as "reserved"
const statusOf = (r: PublicRoomListItemDto): Status => (r.availability === "AVAILABLE" ? "available" : "let");

const levelsLabel = (labels: RoomsContent["labels"], levels: number[]) => {
  const l = [...new Set(levels)].sort((a, b) => a - b);
  if (!l.length) return null;
  return l.length === 1 ? fmt(labels.level, { n: l[0] }) : fmt(labels.levels, { from: l[0], to: l[l.length - 1] });
};

/** Split `total` columns over `n` cells as evenly as possible (wider cells first). */
const spread = (total: number, n: number) => Array.from({ length: n }, (_, i) => Math.max(1, Math.floor(total / n) + (i < total % n ? 1 : 0)));

/** A level the content has no plan for: half the rooms on each side of the corridor, stair core in the south row. */
function generatedFloor(name: string, level: number, units: Unit[]): Floor {
  const half = Math.ceil(units.length / 2);
  const north = units.slice(0, half);
  const south = units.slice(half);
  const ns = spread(12, north.length);
  const at = Math.floor(south.length / 2);
  const ss = spread(10, south.length);
  return {
    level,
    name,
    north: north.map((u, i) => ({ ...u, span: ns[i] })),
    south: [
      ...south.slice(0, at).map((u, i) => ({ ...u, span: ss[i] })),
      { id: `${level}-core`, tier: "core", span: 2, status: "let" },
      ...south.slice(at).map((u, i) => ({ ...u, span: ss[at + i] })),
    ],
  };
}

export function toRoomsData(listing: BuildingListing, content: RoomsContent): RoomsData {
  const { building, rooms, assets } = listing;
  const typeByCode = new Map(building.roomTypes.map((t) => [key(t.code), t]));
  const tierByCode = new Map((Object.entries(content.roomTypeCodes) as [TierId, string][]).map(([tier, code]) => [key(code), tier]));

  // rooms of a type the site can't draw are left out
  const live = new Map<string, Unit & { level: number; tier: TierId }>();
  for (const r of rooms) {
    const tier = tierByCode.get(key(r.roomTypeCode));
    if (!tier) continue;
    const type = typeByCode.get(key(r.roomTypeCode));
    live.set(key(r.roomNumber), {
      id: r.roomNumber,
      tier,
      span: 0,
      level: r.floor,
      status: statusOf(r),
      ...(type && r.monthlyRent !== type.baseMonthlyRent ? { rent: r.monthlyRent } : {}),
      ...(type && r.areaSqm !== type.standardAreaSqm ? { area: r.areaSqm } : {}),
    });
  }

  /* ---- floors: the content's plan where it still matches, generated rows where it doesn't */
  const levels = [...new Set([...building.floors, ...[...live.values()].map((u) => u.level)])].sort((a, b) => b - a);
  const floors: Floor[] = [];
  for (const level of levels) {
    const here = [...live.values()].filter((u) => u.level === level);
    if (!here.length) continue;
    const plan = content.floors.find((f) => f.level === level);
    const planned = new Set(plan ? [...plan.north, ...plan.south].filter((u) => u.tier !== "core").map((u) => key(u.id)) : []);
    const strip = ({ level: _l, ...u }: Unit & { level: number }) => u; // eslint-disable-line @typescript-eslint/no-unused-vars

    if (plan && here.every((u) => planned.has(key(u.id)))) {
      // a planned room the API doesn't list is unpublished: drawn, but never offered
      const fill = (u: Unit): Unit => {
        if (u.tier === "core") return u;
        const l = live.get(key(u.id));
        return l ? { ...strip(l), span: u.span } : { id: u.id, tier: u.tier, span: u.span, status: "let" };
      };
      floors.push({ ...plan, north: plan.north.map(fill), south: plan.south.map(fill) });
    } else {
      floors.push(generatedFloor(fmt(content.labels.level, { n: level }), level, here.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })).map(strip)));
    }
  }

  /* ---- equipment catalogue → add-ons */
  const contentAddon = (name: string) => {
    const n = key(name);
    const id = (Object.entries(content.assetNames) as [AddonId, string[]][]).find(([, names]) => names.some((x) => key(x) === n))?.[0];
    return id ? content.addons.find((a) => a.id === id) : undefined;
  };
  const addons: Addon[] = assets
    .map((a) => {
      const c = contentAddon(a.name);
      return { id: c?.id ?? slug(a.name), name: c?.name ?? a.name, price: a.standardMonthlyRentalFee, note: c?.note ?? "" };
    })
    // content order first, then catalogue items the site has no copy for
    .sort((a, b) => {
      const ia = content.addons.findIndex((x) => x.id === a.id);
      const ib = content.addons.findIndex((x) => x.id === b.id);
      return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
    });
  const offered = new Set(addons.map((a) => a.id));

  /* ---- room types: price, size and capacity from the API, everything else from content */
  const placed = floors.flatMap((f) => [...f.north, ...f.south].map((u) => ({ ...u, level: f.level })));
  const tiers: Tier[] = content.tiers.flatMap((t) => {
    const type = typeByCode.get(key(content.roomTypeCodes[t.id] ?? ""));
    if (!type) return [];
    return [
      {
        ...t,
        price: type.baseMonthlyRent,
        area: type.standardAreaSqm,
        sleeps: type.maxOccupants,
        deposit: building.depositMonths,
        floors: levelsLabel(content.labels, placed.filter((u) => u.tier === t.id).map((u) => u.level)) ?? t.floors,
        included: t.included.filter((id) => offered.has(id)),
      },
    ];
  });

  const { roomTypeCodes: _c, assetNames: _a, labels: _l, ...rest } = content; // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, tiers, floors, addons };
}
