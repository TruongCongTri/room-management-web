"use client";

import { useT } from "@/i18n/I18nProvider";
import { InkMask } from "../fx/Ink";

/**
 * Front elevation of the "Atrium House": drawn as self-drawing linework in the
 * preloader, and shown rendered (stippled concrete, glass, bare trees) in the hero.
 * viewBox is 1000 × 440, ground line at y = 400.
 */

export const BUILDING_W = 1000;
export const BUILDING_H = 440;

type K = "concrete" | "glass" | "dark" | "line";
type Shape =
  | { t: "rect"; x: number; y: number; w: number; h: number; k: K }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number };

const r = (x: number, y: number, w: number, h: number, k: K = "concrete"): Shape => ({ t: "rect", x, y, w, h, k });
const l = (x1: number, y1: number, x2: number, y2: number): Shape => ({ t: "line", x1, y1, x2, y2 });

/** Small deterministic PRNG so server and client render identical drawings. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Bare tree as curved, tapering branches grouped by depth (thick trunk → fine twigs). */
function tree(cx: number, base: number, height: number, seed: number) {
  const rand = rng(seed);
  const depths: string[][] = Array.from({ length: 7 }, () => []);
  const branch = (x: number, y: number, len: number, angle: number, depth: number) => {
    const bend = (rand() - 0.5) * 0.5;
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    const mx = x + Math.cos(angle + bend) * len * 0.55;
    const my = y + Math.sin(angle + bend) * len * 0.55;
    depths[6 - depth].push(`M${x.toFixed(1)} ${y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    if (depth === 0) return;
    const n = depth > 4 ? 2 : depth > 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (0.42 + rand() * 0.4) + (rand() - 0.5) * 0.25;
      branch(x2, y2, len * (0.66 + rand() * 0.16), angle + spread, depth - 1);
    }
  };
  const trunkTop = base - height * 0.3;
  depths[0].push(`M${cx} ${base}L${cx + (rand() - 0.5) * 4} ${trunkTop}`);
  branch(cx, trunkTop, height * 0.22, -Math.PI / 2 - 0.25, 6);
  branch(cx, trunkTop, height * 0.2, -Math.PI / 2 + 0.3, 5);
  return depths.map((d) => d.join(""));
}

/** Random stipple dots for a pattern tile. */
function dots(seed: number, n: number, size: number, rMax: number) {
  const rand = rng(seed);
  return Array.from({ length: n }, () => [rand() * size, rand() * size, 0.25 + rand() * rMax] as const);
}

const SHAPES: Shape[] = [
  l(60, 400, 960, 400),
  // left podium + stair
  r(150, 300, 180, 100),
  ...Array.from({ length: 9 }, (_, i) => l(160, 316 + i * 9.4, 262 - i * 6, 316 + i * 9.4)),
  l(160, 310, 160, 400),
  // left block
  r(200, 118, 130, 182),
  r(200, 200, 130, 10),
  r(214, 134, 102, 56, "glass"),
  r(214, 222, 102, 62, "glass"),
  l(265, 134, 265, 190),
  l(265, 222, 265, 284),
  // tall fin
  r(330, 80, 14, 320),
  // central glass hall
  r(344, 150, 290, 250, "glass"),
  r(326, 136, 340, 14),
  r(344, 262, 290, 12),
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => l(344 + i * 36.25, 150, 344 + i * 36.25, 262)),
  ...[1, 2, 5, 6, 7].map((i) => l(344 + i * 36.25, 274, 344 + i * 36.25, 400)),
  r(452, 318, 74, 82, "dark"),
  l(489, 318, 489, 400),
  // right fin
  r(634, 90, 14, 310),
  // right block + cantilever
  r(648, 182, 180, 218),
  r(620, 118, 262, 64),
  r(636, 136, 230, 28, "glass"),
  ...Array.from({ length: 10 }, (_, i) => l(668 + i * 14, 204, 668 + i * 14, 296)),
  l(660, 300, 816, 300),
  r(668, 322, 140, 48, "glass"),
  l(738, 322, 738, 370),
  r(866, 182, 8, 218),
  // low garden wall
  r(828, 342, 100, 58),
  l(828, 356, 928, 356),
];

const TREES_FRONT = [tree(96, 400, 230, 7), tree(942, 400, 210, 21)];
const TREES_BACK = [tree(128, 400, 170, 33), tree(908, 400, 160, 45)];

const SHADOWS = [
  "M200 118 L268 118 L200 200 Z",
  "M344 150 L430 150 L344 250 Z",
  "M344 274 L380 274 L344 318 Z",
  "M648 182 L748 182 L648 306 Z",
  "M620 164 L882 164 L882 182 L620 182 Z",
  "M150 300 L200 300 L150 360 Z",
  "M828 342 L860 342 L828 380 Z",
];

const CONCRETE_DOTS = dots(11, 260, 80, 0.55);
const SHADOW_DOTS = dots(17, 520, 60, 0.75);

export const DRAW_COUNT = SHAPES.length + 2;

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={`${id}-concrete`} width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="#e8e6e0" />
        {CONCRETE_DOTS.map(([x, y, rr], i) => (
          <circle key={i} cx={x} cy={y} r={rr} fill="#282828" opacity={0.18 + (i % 5) * 0.06} />
        ))}
        {/* form-tie holes */}
        <circle cx="20" cy="20" r="1.3" fill="#282828" opacity="0.6" />
        <circle cx="60" cy="60" r="1.3" fill="#282828" opacity="0.6" />
        <path d="M0 40 H80" stroke="#282828" strokeWidth="0.3" opacity="0.25" />
      </pattern>
      <pattern id={`${id}-shadow`} width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="#282828" opacity="0.28" />
        {SHADOW_DOTS.map(([x, y, rr], i) => (
          <circle key={i} cx={x} cy={y} r={rr} fill="#1c1c1c" opacity="0.7" />
        ))}
      </pattern>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5d5c58" />
        <stop offset="0.28" stopColor="#a7a6a0" />
        <stop offset="0.3" stopColor="#e9e8e3" />
        <stop offset="1" stopColor="#d7d6d0" />
      </linearGradient>
    </defs>
  );
}

function Trees({ sets, render, off }: { sets: string[][]; render: boolean; off?: (i: number) => number }) {
  return (
    <>
      {sets.map((depths, t) =>
        depths.map((d, k) =>
          d ? (
            <path
              key={`${t}-${k}`}
              d={d}
              fill="none"
              strokeLinecap="round"
              strokeWidth={render ? Math.max(0.5, 3.4 - k * 0.55) : 0.8}
              pathLength={render ? undefined : 1}
              className={render ? undefined : "draw"}
              style={render ? undefined : { strokeDashoffset: off?.(t) ?? 0 }}
            />
          ) : null,
        ),
      )}
    </>
  );
}

function Layer({ render, progress, id }: { render: boolean; progress: number; id: string }) {
  const drawn = (i: number) => {
    if (render) return 0;
    const start = (i / DRAW_COUNT) * 0.75;
    return 1 - Math.min(1, Math.max(0, (progress - start) / 0.25));
  };
  const fillFor = (k: K) =>
    !render ? "none" : k === "glass" ? `url(#${id}-glass)` : k === "dark" ? "#2a2a2a" : k === "concrete" ? `url(#${id}-concrete)` : "none";

  return (
    <g fill="none" stroke="#282828" strokeWidth={render ? 1.4 : 1} strokeLinecap="square">
      {render && (
        <g stroke="#9b9a95" opacity="0.8">
          <Trees sets={TREES_BACK} render />
        </g>
      )}
      {SHAPES.map((s, i) => {
        const common = render
          ? {}
          : { pathLength: 1, className: "draw", style: { strokeDashoffset: drawn(i) } };
        return s.t === "rect" ? (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={fillFor(s.k)} {...common} />
        ) : (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...common} />
        );
      })}
      {render && SHADOWS.map((d) => <path key={d} d={d} fill={`url(#${id}-shadow)`} stroke="none" />)}
      {render && <line x1="40" y1="400" x2="980" y2="400" strokeWidth="2" />}
      <Trees sets={TREES_FRONT} render={render} off={(t) => drawn(SHAPES.length + t)} />
    </g>
  );
}

export default function Building({
  variant,
  progress = 1,
  reveal = 1,
  idPrefix = "bld",
  className = "",
  children,
}: {
  /** line: linework only · render: finished drawing · ink: linework with the render bleeding in by `reveal`. */
  variant: "line" | "render" | "ink";
  /** 0–1, how much of the linework is drawn (line variant). */
  progress?: number;
  /** 0–1, how much of the render shows through the ink mask (ink variant). */
  reveal?: number;
  idPrefix?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${BUILDING_W} ${BUILDING_H}`}
      className={className}
      role="img"
      aria-label={useT().drawings.building}
    >
      <Defs id={idPrefix} />
      {variant === "ink" && <InkMask id={`${idPrefix}-ink`} w={BUILDING_W} h={BUILDING_H} p={reveal} rough={80} />}
      {variant !== "render" && <Layer render={false} progress={variant === "ink" ? 1 : progress} id={idPrefix} />}
      {variant !== "line" && (
        <g mask={variant === "ink" ? `url(#${idPrefix}-ink)` : undefined}>
          <Layer render progress={1} id={idPrefix} />
        </g>
      )}
      {children}
    </svg>
  );
}
