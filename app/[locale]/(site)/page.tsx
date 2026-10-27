import Hero from "@/components/home/Hero";
import Statement from "@/components/home/Statement";
import Problems from "@/components/home/Problems";
import Story from "@/components/home/Story";
import Products from "@/components/home/Products";
import WhyUs from "@/components/home/WhyUs";
import UseCases from "@/components/home/UseCases";
import Cta from "@/components/home/Cta";
import { getLocale } from "@/i18n/locale";
import { getHome, getRooms } from "@/lib/api/server";
import Seed from "@/lib/store/Seed";

export default async function Home() {
  const locale = await getLocale();
  const [home, rooms] = await Promise.all([getHome(locale), getRooms(locale)]);
  return (
    <Seed data={{ getHome: home, getRooms: rooms }}>
      <Hero />
      <Statement />
      <Problems />
      <Story />
      <Products />
      <WhyUs />
      <UseCases />
      <Cta />
    </Seed>
  );
}
