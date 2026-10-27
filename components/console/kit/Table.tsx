"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { localizeHref } from "@/i18n/config";
import { useLocale } from "@/i18n/I18nProvider";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { fmt } from "@/i18n/config";
import type { Pagination } from "@/lib/console/baseQuery";

/**
 * Data tables in the price table's style: mono column heads on a sticky ruled row, dashed column rules,
 * rows that open a record on click (the first cell also holds a real link for keyboard and new-tab use).
 */
export type Column<T> = {
  key: string;
  head: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Hidden below this breakpoint so phone tables keep the essentials. */
  hideBelow?: "md" | "lg";
  width?: string;
};

const HIDE = { md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;
const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;
const PAD = "px-[clamp(12px,1.2vw,22px)]";

export function Table<T>({
  columns,
  rows,
  rowKey,
  href,
  loading,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  /** Where a row opens (a console path, localized here). */
  href?: (row: T) => string | null;
  loading?: boolean;
  empty?: ReactNode;
  caption?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const go = (row: T) => {
    const to = href?.(row);
    if (to) router.push(localizeHref(locale, to));
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={`t-mono-xs sticky top-0 z-10 border-b border-r border-dashed border-line border-b-line bg-paper py-2.5 font-medium text-ink/50 last:border-r-0 ${PAD} ${ALIGN[c.align ?? "left"]} ${c.hideBelow ? HIDE[c.hideBelow] : ""}`}
              >
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={loading && rows?.length ? "opacity-50 transition-opacity" : ""}>
          {!rows && loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="skeleton">
                  {columns.map((c) => (
                    <td key={c.key} className={`border-b border-line py-3.5 ${PAD} ${c.hideBelow ? HIDE[c.hideBelow] : ""}`}>
                      <span className="inline-block h-3 w-3/4">&nbsp;</span>
                    </td>
                  ))}
                </tr>
              ))
            : rows?.map((row) => {
                const to = href?.(row);
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={to ? () => go(row) : undefined}
                    className={`group ${to ? "cursor-pointer hover:bg-paper-2/70" : ""}`}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`t-body border-b border-r border-dashed border-line border-b-line py-3 align-top text-ink! last:border-r-0 ${PAD} ${ALIGN[c.align ?? "left"]} ${c.hideBelow ? HIDE[c.hideBelow] : ""} ${c.align === "right" ? "tabular-nums" : ""}`}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
      {rows && rows.length === 0 && !loading && <div className="border-b border-line">{empty}</div>}
    </div>
  );
}

/** A link in a table's first cell: the row is clickable, this keeps it reachable by keyboard and new tabs. */
export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  const locale = useLocale();
  return (
    <a href={localizeHref(locale, href)} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink hover:text-accent">
      {children}
    </a>
  );
}

/** Page cells: previous / "page n of m · total" / next. */
export function Pager({ pagination, onPage }: { pagination: Pagination | undefined; onPage: (page: number) => void }) {
  const t = useC().common;
  if (!pagination || pagination.totalPages <= 1) {
    return pagination ? <p className={`t-mono-xs border-b border-line py-2.5 text-ink/45 ${PAD}`}>{fmt(t.total, { n: pagination.totalItems })}</p> : null;
  }
  return (
    <nav aria-label={t.pagination} className="grid grid-cols-[auto_1fr_auto] border-b border-line">
      <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => onPage(pagination.page - 1)} className={`t-mono border-r border-line py-2.5 hover:bg-paper-2 disabled:opacity-35 ${PAD}`}>
        ← {t.previous}
      </button>
      <p className={`t-mono-xs self-center text-center text-ink/55 ${PAD}`}>
        {fmt(t.pageOf, { page: pagination.page, pages: pagination.totalPages, n: pagination.totalItems })}
      </p>
      <button type="button" disabled={!pagination.hasNextPage} onClick={() => onPage(pagination.page + 1)} className={`t-mono border-l border-line py-2.5 hover:bg-paper-2 disabled:opacity-35 ${PAD}`}>
        {t.next} →
      </button>
    </nav>
  );
}
