import type { Metadata } from "next";
import MissingPath from "@/components/MissingPath";
import SiteChrome from "@/components/SiteChrome";
import { Button } from "@/components/ui";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getSite } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(await getLocale()).meta.notFound.title };
}

export default async function NotFound() {
  const locale = await getLocale();
  const t = getMessages(locale).ui.notFound;
  const { notFound } = await getSite(locale);
  return (
    <SiteChrome>
      <section className="on-dark blueprint-dark relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-ink text-paper">
        <div className="flex w-full flex-1 flex-col">
          <div className="label flex justify-between border-b border-paper/15 px-[clamp(16px,2.3vw,44px)] py-6">
            <span>{t.label}</span>
            <span className="blink text-accent">{t.signal}</span>
          </div>

          <div className="grid flex-1 lg:grid-cols-12">
            <div className="flex flex-col justify-center border-b border-paper/15 px-[clamp(16px,2.3vw,44px)] py-12 lg:col-span-7 lg:border-b-0 lg:border-r">
              <h1 className="display flex items-center text-[34vw] leading-[0.8] lg:text-[22vw] 2xl:text-[340px]">
                4
                {/* the "0" is an empty room with its door open */}
                <svg viewBox="0 0 100 130" className="mx-[0.04em] h-[0.72em] w-auto" aria-hidden="true">
                  <rect x="6" y="6" width="88" height="118" fill="none" stroke="currentColor" strokeWidth="8" />
                  <rect x="6" y="6" width="88" height="118" fill="none" stroke="var(--accent)" strokeWidth="8" strokeDasharray="18 14" className="blink" />
                  <line x1="30" y1="124" x2="70" y2="124" stroke="var(--ink)" strokeWidth="10" />
                  <path d="M30 124 V84 A40 40 0 0 1 70 124" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="4 4" />
                  <text x="50" y="62" textAnchor="middle" fill="var(--accent)" style={{ fontSize: 14, fontFamily: "var(--font-geist-mono)" }}>
                    ?
                  </text>
                </svg>
                4
              </h1>
              <p className="display mt-6 text-4xl md:text-6xl">
                {notFound.title[0]} <span className="text-accent">{notFound.title[1]}</span>
              </p>
            </div>

            <div className="flex flex-col justify-center px-[clamp(16px,2.3vw,44px)] py-12 lg:col-span-5">
              <p className="text-lg text-paper/70">
                {notFound.text}{" "}
                <code className="label text-[13px]">
                  <MissingPath />
                </code>{" "}
                {t.notInRegistry}
              </p>

              <ol className="label mt-8 space-y-2 border-y border-paper/15 py-6">
                {notFound.log.map(([n, text, status]) => (
                  <li key={n} className="flex items-center gap-4">
                    <span className="text-paper/40">{n}</span>
                    <span className="flex-1">{text}</span>
                    <span className={status === "FAIL" ? "bg-accent px-1.5 text-white" : "text-accent"}>{status}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/" variant="accent">
                  {t.back}
                </Button>
                <Button href="/featured-products">{t.allRooms}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
