/**
 * Mock database: the content the site shows today, in the shape of the API contract
 * (lib/api/types.ts), in each locale. Served by the route handlers in app/api and, on the server,
 * read in-process when no API_BASE_URL is configured. Replace the backend, not this file's consumers.
 *
 * Text lives in the locale files (i18n/messages/{vi,en}.json → `content`); this file holds what is
 * the same in every language (prices, sizes, the floor layout, photo files) and puts the two together.
 */
import type { AboutData, Addon, ContactData, FeatureId, FixedFee, Floor, HomeData, Hotspot, PlanIssue, Photo, SiteData, Status, Tier, TierId, Unit } from "../types";
import type { RoomsContent } from "../listing/adapter";
import { fmt, type Locale } from "../../../i18n/config";
import { getMessages } from "../../../i18n/messages";
import { vndShort } from "../../format";

/* ---------------------------------------------------------------- rooms */

const FEATURE_ORDER: FeatureId[] = ["furnished", "aircon", "window", "bath", "kitchen", "balcony", "mezzanine"];

type TierSpec = Omit<Tier, "name" | "short" | "audience" | "summary" | "text" | "floors" | "minStay">;

const TIER_SPECS: TierSpec[] = [
  {
    id: "dorm",
    n: "01",
    price: 1_600_000,
    per: "bed",
    area: 28,
    sleeps: 1,
    // `bath` is a string here: replaced by the locale's wording ("Ensuite, shared by 4")
    features: { furnished: true, aircon: true, window: true, bath: "shared", kitchen: false, balcony: false, mezzanine: false },
    included: ["wardrobe"],
    deposit: 1,
  },
  {
    id: "single",
    n: "02",
    price: 3_200_000,
    per: "room",
    area: 12,
    sleeps: 1,
    features: { furnished: true, aircon: true, window: true, bath: true, kitchen: false, balcony: false, mezzanine: false },
    included: [],
    deposit: 1,
  },
  {
    id: "studio",
    n: "03",
    price: 4_800_000,
    per: "room",
    area: 20,
    sleeps: 2,
    features: { furnished: true, aircon: true, window: true, bath: true, kitchen: true, balcony: false, mezzanine: false },
    included: ["fridge"],
    deposit: 2,
  },
  {
    id: "loft",
    n: "04",
    price: 6_200_000,
    per: "room",
    area: 28,
    sleeps: 2,
    features: { furnished: true, aircon: true, window: true, bath: true, kitchen: true, balcony: true, mezzanine: true },
    included: ["fridge", "wardrobe"],
    deposit: 2,
  },
  {
    id: "twobed",
    n: "05",
    price: 8_500_000,
    per: "room",
    area: 42,
    sleeps: 4,
    features: { furnished: true, aircon: true, window: true, bath: true, kitchen: true, balcony: true, mezzanine: false },
    included: ["fridge", "washer"],
    deposit: 2,
  },
];

/** Photo files and their Unsplash pages, in display order; captions and alt text come from the locale file. */
const PHOTO_SOURCES: Record<TierId, [file: string, source: string][]> = {
  dorm: [
    ["dorm-1.jpg", "a-room-filled-with-lots-of-bunk-beds-next-to-a-window-TzMGehZmocI"],
    ["dorm-2.jpg", "black-metal-bunk-bed-WQJvWU_HZFo"],
    ["dorm-3.jpg", "desk-with-globe-plant-and-two-stools-8oZxNzURtu8"],
    ["dorm-4.jpg", "brown-wooden-bunk-beds-kT-ZyaiwBe0"],
    ["dorm-5.jpg", "white-and-gray-floral-bed-linen-T1Yvmf4oleQ"],
    ["dorm-6.jpg", "white-mattress-OfOvGfwpCIM"],
    ["dorm-7.jpg", "empty-chair-oKHHspCSWHQ"],
    ["dorm-8.jpg", "a-cluttered-room-with-a-desk-chairs-and-luggage-mORrLn55f0M"],
    ["dorm-9.jpg", "white-wooden-desk-near-bed-inside-the-room-WuQME0I_oZA"],
    ["dorm-10.jpg", "brown-wooden-chair-near-mattress-Cz_Xbm3Jyyw"],
  ],
  single: [
    ["single-1.jpg", "white-bed-pillow-on-bed-qnYbBALP4dA"],
    ["single-2.jpg", "modern-bedroom-with-desk-bed-and-city-view-f_mWO1Spf4w"],
    ["single-3.jpg", "a-bathroom-with-a-toilet-sink-and-shower-huao2cP_sSk"],
    ["single-4.jpg", "cozy-modern-bedroom-with-single-bed-window-and-blue-decor--bKPWxIX3nI"],
    ["single-5.jpg", "cozy-bedroom-with-a-single-bed-and-window-view-5UuMPgXHekA"],
    ["single-6.jpg", "modern-bedroom-featuring-a-bed-white-wardrobe-and-window-eeoQBGB-pYg"],
    ["single-7.jpg", "bright-room-with-a-desk-pink-chair-and-window-blinds-KGo29e3zjI0"],
    ["single-8.jpg", "attic-bedroom-with-a-bed-and-window-NhNccu6YZAE"],
    ["single-9.jpg", "modern-bedroom-with-a-desk-and-city-view-t8kYx7Xvy0U"],
    ["single-10.jpg", "a-bright-bedroom-with-a-desk-and-a-large-bed-bhoMFZB_6Bg"],
  ],
  studio: [
    ["studio-1.jpg", "a-room-with-a-bed-and-a-table-with-a-bowl-on-it-dEuvqNbwRuw"],
    ["studio-2.jpg", "studio-apartment-kitchenette-and-bed-YDLDyqibZmU"],
    ["studio-3.jpg", "a-bathroom-with-a-toilet-sink-and-shower-V-lDT7pTtz4"],
    ["studio-4.jpg", "a-room-with-a-table-chairs-and-a-television-hrY-pZqFGyI"],
    ["studio-5.jpg", "a-hotel-room-with-a-large-bed-and-a-window-qbhF5gOzhVU"],
    ["studio-6.jpg", "a-kitchen-with-a-table-and-chairs-in-it-NoPzk4m4jHc"],
    ["studio-7.jpg", "white-bed-linen-on-bed-NngNVT74o6s"],
    ["studio-8.jpg", "modern-kitchen-and-dining-area-with-water-view-bQ254EQbbjg"],
    ["studio-9.jpg", "modern-living-space-with-large-window-overlooking-nature-b6Bs19onFtY"],
    ["studio-10.jpg", "modern-kitchen-with-sink-stove-and-washing-machine-kyfvku_y1T0"],
  ],
  loft: [
    ["loft-1.jpg", "people-working-in-a-spacious-loft-with-a-large-table-ap3cdB8iY1k"],
    ["loft-2.jpg", "modern-open-plan-loft-apartment-with-dining-area-and-kitchen-tqCfLSHgaIo"],
    ["loft-3.jpg", "modern-living-room-with-green-sofa-and-brick-wall-ojLOdyLG_as"],
    ["loft-4.jpg", "industrial-loft-with-dining-area-s95oB2n9jng"],
    ["loft-5.jpg", "brown-wooden-table-with-chairs-ZXZ7t7TneQs"],
    ["loft-6.jpg", "modern-staircase-with-metal-railings-and-steps-GxQInQPa10c"],
    ["loft-7.jpg", "a-bed-sitting-in-a-bedroom-next-to-a-closet-etIFTz0LhFQ"],
    ["loft-8.jpg", "a-living-room-filled-with-furniture-and-lots-of-windows-G4fICun7Q48"],
    ["loft-9.jpg", "white-and-black-sectional-couch-_r2OaHNW1GY"],
    ["loft-10.jpg", "a-large-plant-in-a-large-room-with-lots-of-windows-ffjwHrafblk"],
  ],
  twobed: [
    ["twobed-1.jpg", "modern-stylish-living-room-with-open-concept-kitchen-43vHzsfrmxk"],
    ["twobed-2.jpg", "modern-kitchen-with-stainless-steel-refrigerator-and-washing-machine-Vcrg4HzaQqY"],
    ["twobed-3.jpg", "modern-bedroom-with-a-bed-desk-and-mirrors-v6iTdvOQsW4"],
    ["twobed-4.jpg", "white-and-brown-living-room-set-QGxBeUDkeWk"],
    ["twobed-5.jpg", "white-and-gray-sofa-chair-near-white-wall--raUwtFMIpo"],
    ["twobed-6.jpg", "brown-wooden-round-table-near-white-sofa-SrioT6tdWII"],
    ["twobed-7.jpg", "white-bed-pillow-on-brown-wooden-bed-frame-gVKmonDbotU"],
    ["twobed-8.jpg", "white-front-load-washing-machine-rJe9rkOvBWY"],
    ["twobed-9.jpg", "rectangular-brown-and-white-sink-kDtuOUIkwrk"],
    ["twobed-10.jpg", "home-office-living-room-workspace-xtDpXi_a-YQ"],
  ],
};

/** Charged every month at a flat rate. No meters, no surprises. */
const FEE_SPECS: Omit<FixedFee, "name" | "unit" | "note">[] = [
  { id: "water", perPerson: true, amount: { dorm: 80_000, single: 100_000, studio: 100_000, loft: 100_000, twobed: 100_000 } },
  { id: "power", amount: { dorm: 250_000, single: 350_000, studio: 450_000, loft: 550_000, twobed: 750_000 } },
  { id: "wifi", amount: { dorm: 50_000, single: 100_000, studio: 100_000, loft: 100_000, twobed: 150_000 } },
  { id: "service", amount: { dorm: 100_000, single: 150_000, studio: 150_000, loft: 200_000, twobed: 250_000 } },
  { id: "parking", perVehicle: true, amount: { dorm: 150_000, single: 150_000, studio: 150_000, loft: 150_000, twobed: 150_000 } },
];

/** Rented month by month: add or return them whenever you like. */
const ADDON_PRICES: [id: string, price: number][] = [
  ["fridge", 150_000],
  ["wardrobe", 80_000],
  ["washer", 200_000],
  ["microwave", 50_000],
  ["desk", 70_000],
  ["purifier", 100_000],
  ["tv", 150_000],
  ["mattress", 60_000],
];

// rows are 12 columns wide; "core" (stair and lift) sits at columns 5–6 of the south row on every level
type Row = (TierId | "core")[];

const STATUS_CYCLE: Status[] = ["let", "available", "let", "reserved", "let", "let", "available"];

const row = (level: number, start: number, cells: Row): Unit[] => {
  const out: Unit[] = [];
  let k = start;
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const span = c === "core" ? 2 : c === "single" ? 2 : c === "loft" || c === "twobed" ? 4 : 3;
    const id = c === "core" ? `${level}-core` : `${level}${String(k++).padStart(2, "0")}`;
    out.push({ id, tier: c, span, status: STATUS_CYCLE[(level * 5 + k * 3) % STATUS_CYCLE.length] });
  }
  return out;
};

const floor = (levelName: string, level: number, north: Row, south: Row): Floor => {
  const n = row(level, 1, north);
  return { level, name: fmt(levelName, { n: level }), north: n, south: row(level, n.length + 1, south) };
};

const FLOOR_ROWS: [level: number, north: Row, south: Row][] = [
  [6, ["loft", "loft", "loft"], ["loft", "core", "twobed", "single"]],
  [5, ["twobed", "studio", "studio", "single"], ["twobed", "core", "studio", "studio"]],
  [4, ["studio", "studio", "studio", "studio"], ["single", "single", "core", "studio", "studio"]],
  [3, ["single", "single", "studio", "studio", "single"], ["single", "single", "core", "studio", "studio"]],
  [2, ["dorm", "dorm", "single", "single", "single"], ["single", "single", "core", "single", "single", "single"]],
  [1, ["dorm", "dorm", "dorm", "dorm"], ["single", "single", "core", "dorm", "dorm"]],
];

/** Catalogue names (any language) the listing API may use for each add-on. */
const ASSET_NAMES: Record<string, string[]> = {
  fridge: ["Fridge", "Tủ lạnh"],
  wardrobe: ["Wardrobe", "Tủ quần áo"],
  washer: ["Washing machine", "Máy giặt"],
  microwave: ["Microwave", "Lò vi sóng"],
  desk: ["Second desk & chair", "Bàn ghế làm việc", "Bàn ghế làm việc thêm"],
  purifier: ["Air purifier", "Máy lọc không khí"],
  tv: ["Smart TV", "Tivi"],
  mattress: ["Topper mattress", "Nệm topper"],
};

/* ------------------------------------------------------- shared, no text */

const CLIENT_LOGOS = ["Riverside Uni", "Tech Park East", "City Poly", "Harbor Logistics", "North Medical", "Linden Studio", "Metro Line 1"];
const TEAM = ["Mai Tran", "Daniel Okafor", "Linh Pham", "Arjun Mehta", "Sofia Lindqvist", "Quang Vo"];
const SOCIALS = ["LinkedIn", "Instagram", "Dribbble", "YouTube"];

// marker positions are % of the drawing
const HOTSPOT_AT: Omit<Hotspot, "code" | "text">[] = [
  { id: "h1", x: 26.5, y: 57 },
  { id: "h2", x: 48.8, y: 47.5 },
  { id: "h3", x: 73.5, y: 66 },
];
const PLAN_ISSUE_AT: Omit<PlanIssue, "title" | "room" | "text" | "fix">[] = [
  { id: "i1", n: "01", x: 22, y: 22 },
  { id: "i2", n: "02", x: 49, y: 80 },
  { id: "i3", n: "03", x: 78, y: 44 },
];

/* ------------------------------------------------------------ assembled */

function build(locale: Locale) {
  const { content: c, ui } = getMessages(locale);
  const r = c.rooms;

  const tiers: Tier[] = TIER_SPECS.map((s) => {
    const text = r.tiers[s.id];
    const features = { ...s.features, bath: typeof s.features.bath === "string" && "bath" in text ? text.bath : s.features.bath };
    return { ...s, features, name: text.name, short: text.short, audience: text.audience, summary: text.summary, text: text.text, floors: text.floors, minStay: text.minStay };
  });

  const photos = Object.fromEntries(
    (Object.keys(PHOTO_SOURCES) as TierId[]).map((tier) => [
      tier,
      PHOTO_SOURCES[tier].map(([file, source], i): Photo => ({ src: `/rooms/${file}`, source: `https://unsplash.com/photos/${source}`, ...r.photos[tier][i] })),
    ]),
  ) as Record<TierId, Photo[]>;

  const fixedFees: FixedFee[] = FEE_SPECS.map((f) => ({ ...f, ...r.fixedFees[f.id as keyof typeof r.fixedFees] }));
  const addons: Addon[] = ADDON_PRICES.map(([id, price]) => ({ id, price, ...r.addons[id as keyof typeof r.addons] }));

  /**
   * Rooms content: the copy and drawings the site owns. Prices, areas, capacity, which rooms exist,
   * availability, the deposit and the equipment catalogue are replaced by the Public Listing API
   * (lib/api/listing/adapter.ts); the statuses and prices here only feed the mock listing.
   */
  const rooms: RoomsContent = {
    leaseDiscount: 0.1,
    featureLabels: FEATURE_ORDER.map((k) => [k, r.featureLabels[k]]),
    tiers,
    photos,
    fixedFees,
    addons,
    floors: FLOOR_ROWS.map(([level, north, south]) => floor(r.labels.level, level, north, south)),
    ground: r.ground,
    steps: r.steps,
    faqs: r.faqs,
    labels: r.labels,
    roomTypeCodes: { dorm: "DORM", single: "SINGLE", studio: "STUDIO", loft: "LOFT", twobed: "TWO_BED" },
    assetNames: ASSET_NAMES,
  };

  const from = vndShort(Math.min(...tiers.map((t) => t.price)), ui.format);
  const h = c.home;

  const home: HomeData = {
    hero: { title: h.hero.title, body: fmt(h.hero.body, { from }), ticker: h.hero.ticker.map((t) => fmt(t, { from })) },
    hotspots: HOTSPOT_AT.map((p) => ({ ...p, ...h.hotspots[p.id as keyof typeof h.hotspots] })),
    statement: h.statement,
    partners: { names: CLIENT_LOGOS, note: h.partnersNote },
    problems: h.problems,
    storyPhrases: h.storyPhrases,
    storySteps: h.storySteps,
    planIssues: PLAN_ISSUE_AT.map((p) => ({ ...p, ...h.planIssues[p.id as keyof typeof h.planIssues] })),
    agentPoints: h.agentPoints,
    whySteps: h.whySteps,
    useCases: h.useCases,
  };

  const s = c.site;
  const L = s.footer.links;
  const rooms_ = "/featured-products";
  const site: SiteData = {
    brand: {
      name: "Atrium",
      tagline: s.brand.tagline,
      email: "hello@atrium.example",
      leasingEmail: "leasing@atrium.example",
      phone: "+84 28 0000 0000",
      address: s.brand.address as [string, string],
    },
    // hrefs have no locale: the site's links add the visitor's (components/LocaleLink.tsx)
    nav: [
      {
        label: s.nav.rooms,
        href: rooms_,
        children: [...tiers.map((t) => ({ label: t.name, href: `${rooms_}#${t.id}` })), { label: s.nav.pricing, href: `${rooms_}#pricing` }],
      },
      { label: s.nav.about, href: "/about-us" },
    ],
    contactCta: { label: s.contactCta, href: "/contact-us" },
    footer: {
      tagline: s.footer.tagline,
      columns: [
        {
          title: s.footer.columns.company,
          links: [
            { href: "/", label: L.home },
            { href: "/about-us", label: L.about },
            { href: "/contact-us", label: L.contact },
          ],
        },
        {
          title: s.footer.columns.rooms,
          links: [...tiers.slice(0, 3).map((t) => ({ href: `${rooms_}#${t.id}`, label: t.name })), { href: `${rooms_}#pricing`, label: L.pricing }],
        },
        {
          title: s.footer.columns.help,
          links: [
            { href: `${rooms_}#explorer`, label: L.explorer },
            { href: `${rooms_}#fees`, label: L.fees },
            { href: `${rooms_}#faq`, label: L.faq },
            { href: "/contact-us", label: L.viewing },
          ],
        },
      ],
      subscribe: s.footer.subscribe,
      socials: SOCIALS,
      legal: s.footer.legal,
      copyright: s.footer.copyright,
    },
    cta: { title: s.cta.title, body: s.cta.body, button: { label: s.cta.button, href: "/contact-us" } },
    preloader: { ...s.preloader, meta: s.preloader.meta as [string, string][] },
    notFound: {
      title: s.notFound.title as [string, string],
      text: s.notFound.text,
      log: s.notFound.log as SiteData["notFound"]["log"],
    },
  };

  const { teamRoles, ...a } = c.about;
  const about: AboutData = { ...a, team: TEAM.map((name, i) => ({ name, role: teamRoles[i] })), partners: CLIENT_LOGOS };

  const contact: ContactData = c.contact;

  return { site, home, rooms, about, contact };
}

export type Database = ReturnType<typeof build>;

const built = new Map<Locale, Database>();

/** One locale's resources, built once per locale. */
export function database(locale: Locale): Database {
  let db = built.get(locale);
  if (!db) built.set(locale, (db = build(locale)));
  return db;
}
