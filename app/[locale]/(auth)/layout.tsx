import type { Metadata } from "next";
import { Suspense } from "react";
import AuthFrame from "@/components/console/auth/AuthFrame";
import { getConsoleMessages } from "@/i18n/console";
import ConsoleI18nProvider from "@/i18n/ConsoleI18nProvider";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = getConsoleMessages(await getLocale()).meta;
  return { title: { default: t.signIn, template: t.titleTemplate }, robots: { index: false, follow: false } };
}

/** Sign-in, first activation and password reset: the site's sheet, without the marketing chrome. */
export default async function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  const dictionary = getConsoleMessages(await getLocale());
  return (
    <ConsoleI18nProvider dictionary={dictionary}>
      <AuthFrame>
        <Suspense>{children}</Suspense>
      </AuthFrame>
    </ConsoleI18nProvider>
  );
}
