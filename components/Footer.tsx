"use client";

import { useT } from "@/i18n/I18nProvider";
import { useSite } from "@/lib/data";
import FooterSubscribe from "./FooterSubscribe";
import FooterLinks from "./FooterLinks";
import FooterWordmark from "./FooterWordmark";
import LogoMark from "./LogoMark";
import { Ruler, Plus } from "./home/Rulers";

const pad = "p-[clamp(12px,0.85vw,16px)]";

export default function Footer() {
  const site = useSite();
  const t = useT().footer;
  if (!site) return null;
  const { brand, footer } = site;

  return (
    <footer className="sheet mb-(--frame) border-t border-line">
      <div className="grid grid-cols-2 md:grid-cols-12">
        {/* row 1 */}
        <p className={`t-h3 col-span-2 border-b border-line md:col-span-3 md:border-r ${pad} min-h-[clamp(140px,14vw,260px)]`}>
          {footer.tagline.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </p>
        {footer.columns.map((col) => (
          <div key={col.title} className={`border-b border-r border-line md:col-span-2 ${pad} min-h-[clamp(140px,14vw,260px)]`}>
            <h3 className="t-mono mb-4 text-ink/70">{col.title}</h3>
            <FooterLinks links={col.links} />
          </div>
        ))}
        {/* logo: construction sketch at rest, solid on hover */}
        <div className="group hidden items-center justify-center border-b border-line md:col-span-3 md:row-span-2 md:flex">
          <span className="relative">
            <LogoMark
              className="h-[clamp(120px,14vw,260px)] w-auto text-ink/35 transition-opacity duration-500 group-hover:opacity-0"
              strokeWidth={1.4}
            />
            <LogoMark
              className="absolute inset-0 h-full w-auto opacity-0 transition-opacity duration-500 ease-[cubic-bezier(.59,.23,.22,.96)] group-hover:opacity-100"
              strokeWidth={5}
            />
            <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 bg-accent transition-transform duration-500 group-hover:scale-100" />
          </span>
        </div>

        {/* row 2 */}
        <div className="col-span-2 flex flex-col border-b border-line md:col-span-3 md:border-r">
          <div className={pad}>
            <h3 className="t-mono mb-3 text-ink/70">{footer.subscribe.title}</h3>
            <p className="t-body">{footer.subscribe.text}</p>
          </div>
          <FooterSubscribe />
        </div>
        <div className={`flex flex-col justify-between border-b border-r border-line md:col-span-2 ${pad}`}>
          <div>
            <h3 className="t-mono mb-3 text-ink/70">{t.address}</h3>
            <address className="t-body not-italic text-ink">
              {brand.address[0]}
              <br />
              {brand.address[1]}
            </address>
          </div>
          <span className="t-body mt-6 text-ink">{t.directions}</span>
        </div>
        <div className="flex flex-col border-b border-r border-line md:col-span-2">
          <div className={`flex-1 border-b border-line ${pad}`}>
            <h3 className="t-mono mb-3 text-ink/70">{t.leasingOffice}</h3>
            <a href={`mailto:${brand.leasingEmail}`} className="t-body text-accent hover:underline">
              {brand.leasingEmail}
            </a>
          </div>
          <div className={`flex-1 ${pad}`}>
            <h3 className="t-mono mb-3 text-ink/70">{t.generalInquiries}</h3>
            <a href={`mailto:${brand.email}`} className="t-body text-ink transition-colors hover:text-accent">
              {brand.email}
            </a>
          </div>
        </div>
        <div className={`border-b border-r border-line md:col-span-2 ${pad}`}>
          <h3 className="t-mono mb-4 text-ink/70">{t.social}</h3>
          <ul className="grid grid-cols-2 gap-y-3">
            {footer.socials.map((s) => (
              <li key={s} className="t-body cursor-default text-ink transition-colors hover:text-accent">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* construction-line wordmark */}
      <div className="relative border-b border-line px-[clamp(16px,2vw,40px)] py-[clamp(16px,1.6vw,30px)]">
        <Ruler className="absolute inset-x-0 top-0" />
        <Ruler className="absolute inset-x-0 bottom-0" />
        <Plus className="left-1 top-1" />
        <Plus className="right-1 top-1" />
        <Plus className="bottom-1 left-1" />
        <Plus className="bottom-1 right-1" />
        <FooterWordmark />
      </div>

      {/* bottom bar */}
      <div className="flex flex-col md:flex-row">
        <p className="t-mono flex flex-1 items-center px-[clamp(16px,1.75vw,34px)] py-3 text-ink/70">
          {footer.copyright}
        </p>
        <ul className="flex border-t border-line md:border-t-0">
          {footer.legal.map((l) => (
            <li key={l} className="t-body flex-1 whitespace-nowrap border-l border-line px-[clamp(12px,1vw,18px)] py-3 text-ink first:border-l-0 md:first:border-l">
              {l}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
