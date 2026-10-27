import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import Preloader from "./Preloader";
import PageTransition from "./fx/PageTransition";
import SmoothScroll from "./fx/SmoothScroll";

/**
 * The public site's chrome: preloader, folding page transition, header, footer and smooth scrolling.
 * Used by the (site) layout and by the locale 404, which renders outside any route group.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Preloader />
      <PageTransition>
        <Header />
        <main className="sheet flex-1">{children}</main>
        <Footer />
      </PageTransition>
      <SmoothScroll />
    </>
  );
}
