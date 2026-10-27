import { notFound } from "next/navigation";

/**
 * Where unknown paths inside a locale land (/vi/whatever, via the fallback rewrite in next.config.ts),
 * so they get that locale's 404 page, with header and footer, prerendered and with a 404 status.
 */
export default function PageNotFound() {
  notFound();
}
