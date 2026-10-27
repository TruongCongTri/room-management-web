/**
 * Room model: helpers derived from the /rooms API response (prices, fees, availability, estimates).
 * Pure functions of the data, memoised per response object, so every component shares one model.
 */
import type { AddonId, RoomsData, Tier, TierId, Unit } from "./api/types";

export type { Addon, AddonId, FeatureId, FixedFee, Floor, Photo, RoomsData, Status, Tier, TierId, Unit } from "./api/types";
export { vnd, vndShort } from "./format";

export type PlacedUnit = Unit & { level: number; tier: TierId };
export type EstimateLine = { kind: "rent" | "fee" | "addon"; id: string; name: string; qty: number; amount: number };

function build(data: RoomsData) {
  const { tiers, fixedFees, addons, floors, leaseDiscount } = data;
  const tierById = Object.fromEntries(tiers.map((t) => [t.id, t])) as Record<TierId, Tier>;
  const allUnits: PlacedUnit[] = floors.flatMap((f) =>
    [...f.north, ...f.south].filter((u): u is Unit & { tier: TierId } => u.tier !== "core").map((u) => ({ ...u, level: f.level })),
  );

  const unitsOf = (tier: TierId) => allUnits.filter((u) => u.tier === tier);
  const floorsOf = (tier: TierId) => floors.filter((f) => [...f.north, ...f.south].some((u) => u.tier === tier)).map((f) => f.level);
  const availableOf = (tier: TierId) => unitsOf(tier).filter((u) => u.status === "available").length;
  const leasePrice = (price: number, yearly: boolean) => (yearly ? Math.round((price * (1 - leaseDiscount)) / 10_000) * 10_000 : price);

  /** Fixed fees for one month: water per person, parking per vehicle, the rest per room. */
  const fixedTotal = (tier: TierId, people = 1, vehicles = 0) =>
    fixedFees.reduce((sum, f) => sum + (f.amount[tier] ?? 0) * (f.perPerson ? people : f.perVehicle ? vehicles : 1), 0);

  /** Monthly estimate for one room. Lines say what they are (`kind`) so the page can word them in its locale. */
  const estimate = ({ tier, yearly, people, vehicles, extras }: { tier: TierId; yearly: boolean; people: number; vehicles: number; extras: AddonId[] }) => {
    const t = tierById[tier];
    const lines: EstimateLine[] = [{ kind: "rent", id: t.id, name: t.name, qty: 1, amount: leasePrice(t.price, yearly) }];
    for (const f of fixedFees) {
      const qty = f.perPerson ? people : f.perVehicle ? vehicles : 1;
      if (qty === 0) continue;
      lines.push({ kind: "fee", id: f.id, name: f.name, qty, amount: (f.amount[tier] ?? 0) * qty });
    }
    for (const id of extras) {
      if (t.included.includes(id)) continue;
      const a = addons.find((x) => x.id === id);
      if (a) lines.push({ kind: "addon", id: a.id, name: a.name, qty: 1, amount: a.price });
    }
    const monthly = lines.reduce((s, l) => s + l.amount, 0);
    return { lines, monthly, deposit: t.price * t.deposit };
  };

  return { ...data, tierById, allUnits, unitsOf, floorsOf, availableOf, leasePrice, fixedTotal, estimate };
}

export type RoomsModel = ReturnType<typeof build>;

const models = new WeakMap<RoomsData, RoomsModel>();

/** One model per API response; the same response always returns the same object. */
export function createRoomsModel(data: RoomsData): RoomsModel {
  let m = models.get(data);
  if (!m) models.set(data, (m = build(data)));
  return m;
}
