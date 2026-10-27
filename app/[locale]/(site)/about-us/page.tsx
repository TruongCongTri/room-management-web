import type { Metadata } from "next";
import About from "@/components/about/About";
import Cta from "@/components/home/Cta";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getAbout } from "@/lib/api/server";
import Seed from "@/lib/store/Seed";

export async function generateMetadata(): Promise<Metadata> {
  return getMessages(await getLocale()).meta.about;
}

export default async function AboutUs() {
  const about = await getAbout(await getLocale());
  return (
    <Seed data={{ getAbout: about }}>
      <About />
      <Cta />
    </Seed>
  );
}
