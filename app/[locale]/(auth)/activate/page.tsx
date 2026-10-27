import type { Metadata } from "next";
import OtpPasswordFlow from "@/components/console/auth/OtpPasswordFlow";
import { getConsoleMessages } from "@/i18n/console";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getConsoleMessages(await getLocale()).meta.activate };
}

export default function ActivatePage() {
  return <OtpPasswordFlow purpose="ACTIVATE_ACCOUNT" />;
}
