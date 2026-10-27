"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/config";
import LocaleLink from "./LocaleLink";

/** Footer link list: the current page and hovered links turn accent. */
export default function FooterLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = stripLocale(usePathname());
  const current = (href: string) => {
    const path = href.split("#")[0];
    return href.includes("#") ? false : path === "/" ? pathname === "/" : pathname.startsWith(path);
  };

  return (
    <ul className="space-y-[clamp(6px,0.6vw,12px)]">
      {links.map((l) => {
        const on = current(l.href);
        return (
          <li key={l.label}>
            <LocaleLink
              href={l.href}
              aria-current={on ? "page" : undefined}
              className={`t-body -m-1 inline-block p-1 transition-colors duration-200 hover:!text-accent ${on ? "!text-accent" : "!text-ink"}`}
            >
              {l.label}
            </LocaleLink>
          </li>
        );
      })}
    </ul>
  );
}
