/**
 * The API contract. The mock API in `lib/api/mock` returns exactly these shapes; a real backend
 * only has to return the same JSON from the same paths (see `lib/api/endpoints.ts`).
 * Every resource is localized: requests carry `?locale=vi|en` and get text in that language.
 */

/* ---------------------------------------------------------------- rooms */

/** Room types the drawings know how to draw (see components/rooms/RoomPlan.tsx). */
export type TierId = "dorm" | "single" | "studio" | "loft" | "twobed";
export type FeatureId = "bath" | "kitchen" | "aircon" | "window" | "balcony" | "mezzanine" | "furnished";
export type AddonId = string;
export type Status = "available" | "reserved" | "let";

export type Tier = {
  id: TierId;
  n: string;
  name: string;
  short: string; // label on drawings
  audience: string;
  summary: string;
  text: string;
  price: number; // VND per month, monthly lease
  per: "bed" | "room";
  area: number; // m²
  sleeps: number;
  floors: string;
  minStay: string;
  features: Record<FeatureId, boolean | string>;
  included: AddonId[]; // add-ons that come with the room
  deposit: number; // months of rent
};

export type Photo = { src: string; caption: string; alt: string; source: string };

export type FixedFee = {
  id: string;
  name: string;
  unit: string;
  note: string;
  perPerson?: boolean;
  perVehicle?: boolean;
  amount: Record<TierId, number>;
};

export type Addon = { id: AddonId; name: string; price: number; note: string };

/** `id` is the room number. `rent` / `area` are set when this room differs from its type (price override). */
export type Unit = { id: string; tier: TierId | "core"; span: number; status: Status; rent?: number; area?: number };
export type Floor = { level: number; name: string; north: Unit[]; south: Unit[] };

export type RoomsData = {
  leaseDiscount: number; // 0.1 = 10% off rent on a 12-month lease
  featureLabels: [FeatureId, string][];
  tiers: Tier[];
  photos: Record<TierId, Photo[]>;
  fixedFees: FixedFee[];
  addons: Addon[];
  floors: Floor[]; // top level first
  ground: { name: string; text: string };
  steps: { title: string; subtitle: string; text: string }[];
  faqs: { q: string; a: string }[];
};

/* ----------------------------------------------------------------- home */

export type Hotspot = { id: string; x: number; y: number; code: string; text: string };
export type PlanIssue = { id: string; n: string; x: number; y: number; title: string; room: string; text: string; fix: string[] };

export type HomeData = {
  hero: { title: string[]; body: string; ticker: string[] };
  hotspots: Hotspot[];
  statement: string;
  partners: { names: string[]; note: string };
  problems: { key: string; title: string[]; text: string }[];
  storyPhrases: string[];
  storySteps: string[];
  planIssues: PlanIssue[];
  agentPoints: string[];
  whySteps: { key: string; text: string }[];
  useCases: { title: string; text: string }[];
};

/* ----------------------------------------------------------------- site */

export type Link = { label: string; href: string };
export type NavItem = Link & { children?: Link[] };

export type SiteData = {
  brand: {
    name: string;
    tagline: string;
    email: string;
    leasingEmail: string;
    phone: string;
    address: [string, string];
  };
  nav: NavItem[];
  contactCta: Link;
  footer: {
    tagline: string[];
    columns: { title: string; links: Link[] }[];
    subscribe: { title: string; text: string };
    socials: string[];
    legal: string[];
    copyright: string;
  };
  cta: { title: string[]; body: string; button: Link };
  preloader: { log: string[]; meta: [string, string][]; welcome: string; statement: string[] };
  notFound: { title: [string, string]; text: string; log: [string, string, "OK" | "FAIL"][] };
};

/* ---------------------------------------------------------------- about */

export type AboutData = {
  left: string;
  right: string;
  title: string[];
  body: string;
  storyLead: string;
  story: string;
  mission: string[];
  teamTitle: string[];
  teamBody: string;
  team: { name: string; role: string }[];
  partnersTitle: string[];
  partnersLabel: string;
  partners: string[];
};

/* -------------------------------------------------------------- contact */

export type ContactData = { title: string; body: string[]; formTitle: string; interestLabel: string };

export type ContactRequest = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  interest?: TierId | null;
  message: string;
};
export type ContactResponse = { id: string; receivedAt: string };

export type SubscribeRequest = { email: string };
export type SubscribeResponse = { id: string };

/** Error body returned with 4xx responses. `fields` maps form fields to messages. */
export type ApiError = { message: string; fields?: Record<string, string> };
