import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE } from "./i18n/config";

/** Marker cookie of a signed-in browser (lib/server/session.ts): no secret, the tokens are httpOnly under /api. */
const SESSION_COOKIE = "rm_sess";
/** Console pages under /{locale}/app need a session; the sign-in page sends a signed-in visitor on to the console. */
const CONSOLE = /^\/app(\/|$)/;
const SIGN_IN = /^\/sign-in\/?$/;

/**
 * Every page lives under /vi or /en. A URL without a locale is redirected to the visitor's last
 * locale (cookie) or the default, Vietnamese: /contact-us → /vi/contact-us.
 * A URL with one remembers it, so the next un-prefixed link lands in the same language.
 * The session check is optimistic only: every API call is authorised by the API itself.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (hasLocale(first)) {
    const rest = pathname.slice(first.length + 1) || "/";
    const signedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";
    if (CONSOLE.test(rest) && !signedIn) {
      const url = request.nextUrl.clone();
      url.pathname = `/${first}/sign-in`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    if (SIGN_IN.test(rest) && signedIn) {
      const next = request.nextUrl.searchParams.get("next") ?? "";
      const url = request.nextUrl.clone();
      const [nextPath, nextSearch = ""] = next.split("?");
      const safe = nextPath.startsWith(`/${first}/app`) && !nextPath.startsWith("//");
      url.pathname = safe ? nextPath : `/${first}/app`;
      url.search = safe && nextSearch ? `?${nextSearch}` : "";
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const url = request.nextUrl.clone();
  url.pathname = `/${hasLocale(saved) ? saved : defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // pages only: not the API, Next internals, or files in public/ (anything with an extension)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
