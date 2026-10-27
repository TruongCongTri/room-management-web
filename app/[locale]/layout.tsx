import type { Metadata } from "next";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "../globals.css";
import Cursor from "@/components/Cursor";
import HydrationMark from "@/components/HydrationMark";
import { locales } from "@/i18n/config";
import I18nProvider from "@/i18n/I18nProvider";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getSite } from "@/lib/api/server";
import StoreProvider from "@/lib/store/StoreProvider";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

/** Both languages are prerendered: /vi/... and /en/... */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getMessages(await getLocale());
  return {
    title: { default: meta.title, template: meta.titleTemplate },
    description: meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  // site-wide data (brand, navigation, footer) for every route; pages add their own
  const site = await getSite(locale);
  return (
    <html lang={locale} className={`${interTight.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <noscript>
          <style>{`.reveal{opacity:1;transform:none}.rise>span{transform:none}[data-preloader]{display:none}`}</style>
        </noscript>
        <I18nProvider locale={locale} dictionary={getMessages(locale).ui}>
          <StoreProvider seed={{ getSite: site }} locale={locale}>
            <div aria-hidden="true" className="sheet-frame" />
            {/* chrome per area: (site) has the marketing header / footer, (auth) and (console) their own */}
            {children}
            <Cursor />
            <HydrationMark />
          </StoreProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
