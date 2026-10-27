"use client";

import Lenis from "lenis";
import { useEffect } from "react";

let instance: Lenis | null = null;
/** The running Lenis instance, if smooth scrolling is active. */
export const getLenis = () => instance;

/** Inertial smooth scrolling for wheel and trackpad (touch keeps native scrolling). */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, autoRaf: true });
    instance = lenis;

    // hold still while the preloader is on screen
    if (!("loaded" in document.documentElement.dataset)) {
      lenis.stop();
      window.addEventListener("atrium:loaded", () => lenis.start(), { once: true });
    }
    return () => {
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}

/** Glide the page to a y position (smooth through Lenis when it's running). */
export function glideTo(y: number) {
  if (instance) instance.scrollTo(y, { duration: 1.1 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
