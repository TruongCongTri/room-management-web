import type { Metadata } from "next";
import Contact from "@/components/contact/Contact";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getContact, getRooms } from "@/lib/api/server";
import Seed from "@/lib/store/Seed";

export async function generateMetadata(): Promise<Metadata> {
  return getMessages(await getLocale()).meta.contact;
}

export default async function ContactUs() {
  const locale = await getLocale();
  // rooms feeds the "interested in" choices on the form
  const [contact, rooms] = await Promise.all([getContact(locale), getRooms(locale)]);
  return (
    <Seed data={{ getContact: contact, getRooms: rooms }}>
      <Contact />
    </Seed>
  );
}
