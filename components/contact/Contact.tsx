"use client";

import ContactForm from "./ContactForm";
import Building from "../home/Building";
import { useT } from "@/i18n/I18nProvider";
import { useContactInfo, useSite } from "@/lib/data";

const pad = "px-[clamp(16px,1.75vw,34px)] py-[clamp(16px,1.6vw,30px)]";

export default function Contact() {
  const site = useSite();
  const contact = useContactInfo();
  const t = useT().contact;
  if (!site || !contact) return null;
  const { brand } = site;

  const cells = [
    [t.leasingOffice, <a key="l" href={`mailto:${brand.leasingEmail}`} className="hover:text-accent">{brand.leasingEmail}</a>],
    [t.generalInquiries, <a key="g" href={`mailto:${brand.email}`} className="hover:text-accent">{brand.email}</a>],
    [t.address, <span key="a">{brand.address[0]},<br />{brand.address[1]}</span>],
  ] as const;

  return (
    <section aria-label={t.aria}>
      {/* title + three contact cells: 6 + 2 + 2 + 2 columns */}
      <div className="grid md:grid-cols-12">
        <div className={`${pad} border-b border-line md:col-span-6 md:border-r`}>
          <h1 className="t-h1 text-[clamp(36px,3.9vw,74px)]!">{contact.title}</h1>
          <p className="t-body mt-[clamp(12px,1.2vw,22px)] text-ink/85">
            {contact.body.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
        {cells.map(([k, v], i) => (
          <div key={k} className={`${pad} flex flex-col justify-between gap-6 border-b border-line md:col-span-2 ${i < 2 ? "md:border-r" : ""}`}>
            <p className="t-mono-xs text-ink/50">{k}</p>
            <p className="t-body text-ink!">{v}</p>
          </div>
        ))}
      </div>

      {/* form + drawing: 6 + 6 columns */}
      <div className="grid md:grid-cols-12">
        <div className="flex flex-col border-b border-line md:col-span-6 md:border-b-0 md:border-r">
          <ContactForm title={contact.formTitle} interestLabel={contact.interestLabel} />
        </div>
        <div className="relative flex items-center overflow-hidden md:col-span-6">
          <div aria-hidden="true" className="sq-grid absolute inset-0 opacity-25" />
          <Building variant="render" idPrefix="contact" className="relative w-[130%] max-w-none translate-x-[8%]" />
        </div>
      </div>
    </section>
  );
}
