import { languageTag, type Locale } from "../../i18n/config";
import { BFF_BASE, filenameOf, queryString, type Request } from "./baseQuery";
import { toProblem, type ApiProblem } from "./problem";

/**
 * Files from the API (Excel exports): fetched through the BFF like any call, then saved by the browser.
 * Not cached in the store (a Blob isn't state).
 */
export async function downloadFile(
  path: string,
  params: Request["params"],
  ctx: { locale: Locale; buildingId: string | null },
  fallbackName: string,
): Promise<ApiProblem | null> {
  const headers = new Headers({ accept: "*/*", "accept-language": languageTag[ctx.locale] });
  if (ctx.buildingId) headers.set("x-building-id", ctx.buildingId);
  let res: Response;
  try {
    res = await fetch(`${BFF_BASE}${path}${queryString(params)}`, { headers, credentials: "same-origin" });
  } catch {
    return toProblem("FETCH_ERROR", null);
  }
  if (!res.ok) return toProblem(res.status, await res.json().catch(() => null), res.headers.get("retry-after"));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameOf(res.headers.get("content-disposition")) ?? fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return null;
}
