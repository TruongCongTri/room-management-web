import SiteChrome from "@/components/SiteChrome";

/** Marketing and public listing pages: the full site chrome. */
export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return <SiteChrome>{children}</SiteChrome>;
}
