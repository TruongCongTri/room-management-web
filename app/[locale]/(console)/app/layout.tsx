import type { Metadata } from "next";
import { Suspense } from "react";
import Shell from "@/components/console/Shell";
import { getConsoleMessages } from "@/i18n/console";
import ConsoleI18nProvider from "@/i18n/ConsoleI18nProvider";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = getConsoleMessages(await getLocale()).meta;
  return { title: { default: t.console, template: t.titleTemplate }, robots: { index: false, follow: false } };
}

/**
 * The signed-in console (staff and residents). Screens are client components reading the API through the
 * BFF; proxy.ts sends visitors without a session to sign in first.
 */
export default async function ConsoleLayout({ children }: LayoutProps<"/[locale]/app">) {
  const dictionary = getConsoleMessages(await getLocale());
  return (
    <ConsoleI18nProvider dictionary={dictionary}>
      <Shell>
        <Suspense>{children}</Suspense>
      </Shell>
    </ConsoleI18nProvider>
  );
}
