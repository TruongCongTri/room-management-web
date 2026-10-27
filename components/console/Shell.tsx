"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fmt, locales, localizeHref, stripLocale } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { consoleApi } from "@/lib/console/api";
import { useLogoutMutation, useMeQuery, type Me } from "@/lib/console/endpoints/identity";
import { isStaff } from "@/lib/console/permissions";
import { rememberBuilding, rememberedBuilding, sessionStarted, setBuilding } from "@/lib/console/slice";
import type { RootState } from "@/lib/store/store";
import { useSite } from "@/lib/data";
import LocaleLink from "../LocaleLink";
import LogoMark from "../LogoMark";
import PixelFill from "../fx/PixelFill";
import { RollText } from "../fx/Roll";
import { ProblemBox } from "./kit/Feedback";
import { ToastProvider } from "./kit/Toast";
import { activeHref, navFor, type NavGroup } from "./nav";
import { MeProvider } from "./MeContext";

const PAD = "px-[clamp(14px,1.4vw,26px)]";

/** The building to work on: the one this browser chose last if the account still has it, else the token's. */
export function pickBuilding(me: Me, saved: string | null): string | null {
  const ids = me.buildings.map((b) => b.id);
  if (saved && ids.includes(saved)) return saved;
  return me.activeBuildingId && ids.includes(me.activeBuildingId) ? me.activeBuildingId : (ids[0] ?? null);
}

function roleLabel(me: Me, t: ReturnType<typeof useC>["enums"]["role"]) {
  return me.roles.map((r) => t[r as keyof typeof t] ?? r).join(" · ");
}

function Nav({ groups, pathname, onPick }: { groups: NavGroup[]; pathname: string; onPick?: () => void }) {
  const active = activeHref(pathname, groups);
  return (
    <nav aria-label={useC().shell.navLabel} className="flex flex-col">
      {groups.map((g) => (
        <div key={g.title} className="border-b border-line">
          <p className={`t-mono-xs ${PAD} pb-1.5 pt-3 text-ink/40`}>{g.title}</p>
          <ul>
            {g.items.map((i) => {
              const on = i.href === active;
              return (
                <li key={i.href}>
                  <LocaleLink
                    href={i.href}
                    onClick={onPick}
                    aria-current={on ? "page" : undefined}
                    className={`fx t-mono flex items-center gap-2 overflow-hidden ${PAD} py-2 ${on ? "text-ink" : "text-ink/60"}`}
                  >
                    <PixelFill color="--ink" />
                    <span aria-hidden="true" className={`size-1.5 shrink-0 ${on ? "bg-accent" : "bg-transparent"}`} />
                    <RollText>{i.label}</RollText>
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BuildingSwitch({ me }: { me: Me }) {
  const t = useC().shell;
  const dispatch = useDispatch();
  const buildingId = useSelector((s: RootState) => s.console.buildingId);
  if (!me.buildings.length) return <span className="t-mono-xs text-ink/45">{t.noBuilding}</span>;
  if (me.buildings.length === 1) return <span className="t-mono truncate">{me.buildings[0].name ?? t.building}</span>;
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="t-mono-xs shrink-0 text-ink/45">{t.building}</span>
      <select
        className="t-mono min-w-0 cursor-pointer truncate bg-transparent outline-none"
        value={buildingId ?? ""}
        onChange={(e) => {
          // drop every cached answer: nothing of the previous building may stay on screen
          rememberBuilding(e.target.value);
          dispatch(consoleApi.util.resetApiState());
          dispatch(setBuilding(e.target.value));
        }}
      >
        {me.buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name ?? b.id.slice(0, 8)}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserMenu({ me }: { me: Me }) {
  const c = useC();
  const t = c.shell;
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [logout, { isLoading }] = useLogoutMutation();
  const signOut = async (everywhere: boolean) => {
    await logout({ everywhere }).unwrap().catch(() => null);
    dispatch(consoleApi.util.resetApiState());
    router.replace(localizeHref(locale, "/sign-in"));
  };
  return (
    <div className="relative h-full" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className={`flex h-full min-w-0 flex-col justify-center gap-0.5 border-l border-line ${PAD} text-left hover:bg-paper-2`}>
        <span className="t-mono truncate">{me.fullName}</span>
        <span className="t-mono-xs truncate text-ink/45">{roleLabel(me, c.enums.role)}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 min-w-60 border border-line bg-paper shadow-[4px_4px_0_0_var(--ink)]">
          <LocaleLink role="menuitem" href="/app/account" onClick={() => setOpen(false)} className={`t-mono block border-b border-line ${PAD} py-3 hover:bg-paper-2`}>
            {t.account}
          </LocaleLink>
          <button role="menuitem" type="button" disabled={isLoading} onClick={() => signOut(false)} className={`t-mono block w-full border-b border-line ${PAD} py-3 text-left hover:bg-paper-2`}>
            {t.signOut}
          </button>
          <button role="menuitem" type="button" disabled={isLoading} onClick={() => signOut(true)} className={`t-mono block w-full ${PAD} py-3 text-left text-accent hover:bg-paper-2`}>
            {t.signOutEverywhere}
          </button>
        </div>
      )}
    </div>
  );
}

function LanguageSwitch({ path }: { path: string }) {
  const locale = useLocale();
  const t = useC().shell;
  return (
    <nav aria-label={t.language} className="t-mono flex items-center gap-1.5">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30">/</span>}
          {l === locale ? (
            <span aria-current="true">{l.toUpperCase()}</span>
          ) : (
            <Link href={`/${l}${path}`} hrefLang={l} lang={l} className="text-ink/50 hover:text-accent">
              {l.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Signed-in frame: header (brand, building, language, account), the role's navigation on the left, the
 * screen on the right. Screens render once the account and its building are known, so every call carries
 * the right X-Building-ID. A session that ends (revoked, expired) sends the visitor to sign in again.
 */
export default function Shell({ children }: { children: ReactNode }) {
  const c = useC();
  const locale = useLocale();
  const router = useRouter();
  const pathname = stripLocale(usePathname());
  const dispatch = useDispatch();
  const site = useSite();
  const { data: me, error, refetch } = useMeQuery();
  const buildingId = useSelector((s: RootState) => s.console.buildingId);
  const ended = useSelector((s: RootState) => s.console.sessionEnded);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!me) return;
    const pick = pickBuilding(me, rememberedBuilding());
    if (pick !== buildingId) dispatch(setBuilding(pick));
  }, [me, buildingId, dispatch]);

  useEffect(() => {
    if (!ended) return;
    dispatch(sessionStarted());
    dispatch(consoleApi.util.resetApiState());
    router.replace(`${localizeHref(locale, "/sign-in")}?next=${encodeURIComponent(localizeHref(locale, pathname))}&expired=1`);
  }, [ended, dispatch, router, locale, pathname]);

  useEffect(() => setMenu(false), [pathname]);

  const groups = useMemo(() => (me ? navFor(me, c.nav) : []), [me, c.nav]);
  const ready = Boolean(me) && (buildingId !== null || !me?.buildings.length);
  const brand = site?.brand.name ?? "Atrium";

  return (
    <ToastProvider>
      <div aria-hidden="true" className="mt-(--frame) h-(--header-h) shrink-0" />
      <header className="fixed inset-x-(--frame) top-(--frame) z-50 flex h-(--header-h) border-x border-b border-line bg-paper">
        <LocaleLink href="/app" aria-label={fmt(c.shell.home, { brand })} className={`flex h-full shrink-0 items-center gap-2 border-r border-line ${PAD} lg:w-60`}>
          <LogoMark className="h-[clamp(24px,2vw,36px)] w-auto" strokeWidth={5} />
          <span className="text-[clamp(16px,1.25vw,24px)] font-bold uppercase tracking-[-0.04em]">{brand}</span>
          <span className="t-mono-xs hidden text-ink/45 xl:inline">{c.shell.console}</span>
        </LocaleLink>
        <div className={`hidden min-w-0 flex-1 items-center md:flex ${PAD}`}>{me && isStaff(me.roles) && <BuildingSwitch me={me} />}</div>
        <div className={`ml-auto flex h-full items-center border-l border-line ${PAD}`}>
          <LanguageSwitch path={pathname} />
        </div>
        {me && (
          <div className="hidden h-full md:block">
            <UserMenu me={me} />
          </div>
        )}
        <button type="button" className="t-mono h-full border-l border-line px-4 lg:hidden" aria-expanded={menu} aria-controls="console-nav" onClick={() => setMenu((m) => !m)}>
          {menu ? c.shell.close : c.shell.menu}
        </button>
      </header>

      <div className="sheet flex min-h-[calc(100svh-var(--header-h)-2*var(--frame))] flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-line lg:block">
          <div className="stick max-h-[calc(100svh-var(--header-h)-2*var(--frame))] overflow-y-auto" data-lenis-prevent>
            <Nav groups={groups} pathname={pathname} />
          </div>
        </aside>
        {menu && (
          <div id="console-nav" className="fixed inset-x-(--frame) bottom-(--frame) top-[calc(var(--frame)+var(--header-h))] z-40 overflow-y-auto border border-line bg-paper lg:hidden">
            {me && isStaff(me.roles) && <div className={`border-b border-line ${PAD} py-3`}><BuildingSwitch me={me} /></div>}
            <Nav groups={groups} pathname={pathname} onPick={() => setMenu(false)} />
            {me && <div className="border-b border-line md:hidden"><UserMenu me={me} /></div>}
          </div>
        )}
        <main id="main" className="min-w-0 flex-1 overflow-x-clip">
          {error && !me && !ended ? (
            <div className={`${PAD} py-10`}>
              <ProblemBox problem={error as never}>
                <button type="button" className="t-mono-xs link-line mt-2 text-ink" onClick={() => refetch()}>
                  {c.common.retry}
                </button>
              </ProblemBox>
            </div>
          ) : (
            // the page always renders (its <Screen> shows a skeleton until the account is known)
            <MeProvider me={me ?? null} ready={ready}>
              {children}
            </MeProvider>
          )}
        </main>
      </div>
    </ToastProvider>
  );
}
