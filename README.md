This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result (it redirects to `/vi`).

You can start editing the page by modifying `app/[locale]/page.tsx`. The page auto-updates as you edit the file.

## Languages (vi, en)

The site is served in Vietnamese (default) and English, under `/vi/...` and `/en/...`.

- **All text lives in two files:** `i18n/messages/vi.json` and `i18n/messages/en.json`, with the same
  keys. `meta` is page titles and descriptions, `ui` is every string the components render, and
  `content` is the text the mock API serves. A key missing from `vi.json` fails type-checking.
  Numbers, prices and the floor layout are the same in both languages, so they stay in code
  (`lib/api/mock/db.ts`).
- **Routing:** every page is under `app/[locale]/` and both locales are prerendered. `proxy.ts`
  redirects a URL without a locale (`/contact-us`) to the visitor's last locale (cookie
  `NEXT_LOCALE`) or to `/vi`. The header has a VI / EN switch that keeps the current page.
- **Links:** content and components write plain paths (`/contact-us`). `components/LocaleLink.tsx`
  (used by `Button`, `CellButton`, the header and the footer) adds the current locale.
- **Reading strings:** Server Components call `getLocale()` (`i18n/locale.ts`) and
  `getMessages(locale)` (`i18n/messages.ts`). Client components call `useT()` and `useLocale()`
  (`i18n/I18nProvider.tsx`), and fill `{placeholders}` with `fmt()` (`i18n/config.ts`).
- **404s:** an unknown `/vi/...` or `/en/...` path is rewritten (fallback rewrite in `next.config.ts`)
  to `app/[locale]/page-not-found`, which shows that locale's 404 page with a 404 status. URLs outside
  both locales get `app/global-not-found.tsx`.
- **Adding a language:** add it to `locales` in `i18n/config.ts`, add `i18n/messages/<code>.json`, and
  register it in `i18n/messages.ts`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Data and API

Every piece of content (rooms, prices, fees, availability, copy, navigation) comes from an API.
Until the real backend exists, a mock API in this app serves the current content. Every request
carries the language, `?locale=vi` or `?locale=en` (plus `Accept-Language` from the server), and
gets its text and validation messages in that language. Without one it defaults to `vi`.

| Path                       | Method | What                                                     |
| -------------------------- | ------ | -------------------------------------------------------- |
| `/site`                    | GET    | Brand, navigation, footer, CTA, preloader, 404 copy      |
| `/home`                    | GET    | Home page content                                        |
| `/rooms`                   | GET    | Room types, prices, fees, add-ons, floors, photos, FAQs  |
| `/about`                   | GET    | About page content and team                              |
| `/contact`                 | GET    | Contact page copy                                        |
| `/contact/messages`        | POST   | Contact form; `201` or `422 { message, fields }`         |
| `/subscriptions`           | POST   | Newsletter; `201` or `422 { message, fields }`           |

The JSON shapes are in `lib/api/types.ts`. `lib/api/mock/db.ts` holds the current data, with its text
taken from `content` in the locale files.

**Switching to the real backend:** serve the same JSON at the same paths, then set
`API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`). No code changes are needed.

How the data flows:

- **Server:** pages call the cached readers in `lib/api/server.ts` (`use cache` with `cacheLife`
  and `cacheTag`: rooms refresh every minute, other content hourly or daily). The backend can clear a
  resource early with `POST /api/revalidate` and `{ "tag": "rooms" }`, sending the
  `x-revalidate-secret` header.
- **Client:** the Redux store (`lib/store`) uses the RTK Query `apiSlice` (`lib/api/apiSlice.ts`).
  Each page hands its server data to the store (`<Seed>`), so the first render already has data and
  the browser doesn't repeat the request. After that, RTK Query keeps it in memory, refetches when
  the tab regains focus or the network reconnects, and retries failed reads.
- **Components:** read data through `useSite`, `useHome`, `useRooms`, `useAbout` and
  `useContactInfo` (`lib/data.ts`). `useRooms` also returns derived helpers (availability, fee
  totals, estimates) from `lib/rooms.ts`.
- **Mock API:** route handlers in `app/api`, which share the request validation in
  `lib/api/validation.ts` with the forms.

### Public Listing API (real backend)

The rooms data on every page is built from the backend's Public Listing endpoints
(`docs/04-Swagger-API.md` §1.5): `GET /public/buildings/{slug}`, `…/rooms` (all pages, 50 per page)
and `…/assets`. Set `LISTING_API_BASE_URL` (e.g. `https://api.rentalcore.vn/api/v1`) and
`LISTING_BUILDING_SLUG`; leave them unset to use a mock of the same endpoints (`lib/api/mock/listing.ts`).
Calls are made in the page's language (`Accept-Language: vi-VN` or `en-US`).

- `lib/api/listing/client.ts`: server-only client. Unwraps the success envelope, turns RFC 7807
  errors into `ListingApiError` (with `errorCode` and `traceId`), sends `If-None-Match` and reuses the
  last body on `304`, retries once on network or 5xx errors, and times out after 8 s.
- `lib/api/listing/adapter.ts`: merges the listing into the site's rooms content. The API decides
  room types, base rent, area, capacity, which rooms exist, availability, per-room rent, the deposit
  and the equipment add-ons. The content keeps the copy, photos, features, fixed fees and the floor
  plan. A level whose rooms don't match the plan is drawn from the API (rooms split across the corridor).
- Map the backend's room type codes and catalogue names in `roomTypeCodes` and `assetNames`
  (`lib/api/mock/db.ts`). Rooms of an unmapped type are left out, because the site has no drawings for them.
- The browser never calls the listing API. It reads the merged result from this app's `/api/rooms`,
  so the backend needs no CORS entry. Staff changes reach the site within a minute, or at once
  when the backend calls `POST /api/revalidate` with `{ "tag": "rooms" }`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
