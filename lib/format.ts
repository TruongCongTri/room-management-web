/** 1250000 → "1.250.000₫" (fixed format so server and browser render the same string). */
export const vnd = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}₫`;

/** How a locale writes millions, from its file (`ui.format`): "{n}M₫" + "." or "{n} triệu" + ",". */
export type ShortFormat = { million: string; decimal: string };

/** 1600000 → "1.6M₫" (en) or "1,6 triệu" (vi) */
export const vndShort = (n: number, f: ShortFormat) =>
  f.million.replace("{n}", (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace(".", f.decimal));
