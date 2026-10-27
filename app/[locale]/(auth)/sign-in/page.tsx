import type { Metadata } from "next";
import SignIn from "@/components/console/auth/SignIn";
import { getConsoleMessages } from "@/i18n/console";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getConsoleMessages(await getLocale()).meta.signIn };
}

export default function SignInPage() {
  return <SignIn />;
}
