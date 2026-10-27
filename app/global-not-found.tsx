import type { Metadata } from "next";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { defaultLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = { title: getMessages(defaultLocale).meta.notFound.title };

/**
 * 404 for URLs outside any locale (e.g. an unknown /api path or a bad locale segment). Pages under
 * /vi and /en use app/[locale]/not-found.tsx instead; this one has no layout, so it offers both languages.
 */
export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={`${interTight.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="on-dark blueprint-dark flex min-h-full flex-col items-start justify-center gap-8 bg-ink px-[clamp(16px,2.3vw,44px)] text-paper">
        <p className="display text-[30vw] leading-[0.8] lg:text-[16vw]">404</p>
        <ul className="space-y-4">
          {locales.map((l) => {
            const m = getMessages(l);
            return (
              <li key={l} lang={l} className="flex flex-wrap items-baseline gap-x-4">
                <span className="display text-3xl md:text-5xl">
                  {m.content.site.notFound.title[0]} <span className="text-accent">{m.content.site.notFound.title[1]}</span>
                </span>
                <a href={`/${l}`} className="label text-accent hover:underline">
                  {m.ui.notFound.back} →
                </a>
              </li>
            );
          })}
        </ul>
      </body>
    </html>
  );
}
