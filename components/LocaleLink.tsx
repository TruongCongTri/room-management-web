"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localizeHref } from "@/i18n/config";
import { useLocale } from "@/i18n/I18nProvider";

/** next/link that keeps the visitor in their locale: "/contact-us" points at "/vi/contact-us". */
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  return <Link href={localizeHref(useLocale(), href)} {...props} />;
}
