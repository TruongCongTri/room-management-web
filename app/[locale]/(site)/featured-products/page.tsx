import type { Metadata } from "next";
import Cta from "@/components/home/Cta";
import Calculator from "@/components/rooms/Calculator";
import Explorer from "@/components/rooms/Explorer";
import Faq from "@/components/rooms/Faq";
import PriceTable from "@/components/rooms/PriceTable";
import RoomTypes from "@/components/rooms/RoomTypes";
import RoomsHero from "@/components/rooms/RoomsHero";
import Steps from "@/components/rooms/Steps";
import { fmt } from "@/i18n/config";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getRooms } from "@/lib/api/server";
import { vndShort } from "@/lib/format";
import Seed from "@/lib/store/Seed";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { meta, ui } = getMessages(locale);
  const rooms = await getRooms(locale);
  const from = vndShort(Math.min(...rooms.tiers.map((t) => t.price)), ui.format);
  return { title: meta.rooms.title, description: fmt(meta.rooms.description, { from }) };
}

export default async function RoomsPage() {
  const rooms = await getRooms(await getLocale());
  return (
    <Seed data={{ getRooms: rooms }}>
      <RoomsHero />
      <RoomTypes />
      <Explorer />
      <PriceTable />
      <Calculator />
      <Steps />
      <Faq />
      <Cta cols="sixths" />
    </Seed>
  );
}
