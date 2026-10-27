"use client";

/**
 * One residential level: two rows of units either side of a corridor, the stair
 * and lift core in the south row. Units can be highlighted by tier and selected.
 */
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import type { Floor, Tier, TierId, Unit } from "@/lib/rooms";

const COL = 100; // svg units per grid column
const X0 = 40;
const NY = 40; // north row
const RD = 210; // row depth
const CY = NY + RD; // corridor
const CD = 70;
const SY = CY + CD; // south row
export const MAP_W = X0 * 2 + COL * 12;
export const MAP_H = SY + RD + 40;

/** Tiny furniture glyph so each unit type reads at a glance. */
function Glyph({ tier, x, y, w, flip }: { tier: TierId; x: number; y: number; w: number; flip: boolean }) {
  // beds sit against the outside wall (top of north units, bottom of south units)
  const by = flip ? y + RD - 74 - 10 : y + 10;
  const bed = (bx: number, bw = 30, bh = 64) => (
    <g key={bx}>
      <rect x={bx} y={by} width={bw} height={bh} rx="2" />
      <rect x={bx + 4} y={flip ? by + bh - 14 : by + 4} width={bw - 8} height="10" rx="2" />
    </g>
  );
  switch (tier) {
    case "dorm":
      return (
        <>
          {bed(x + 10)}
          {bed(x + w - 40)}
          <path d={`M${x + 10} ${by} l30 64 M${x + w - 40} ${by} l30 64`} strokeDasharray="3 3" />
        </>
      );
    case "single":
      return bed(x + 10);
    case "studio":
      return (
        <>
          {bed(x + 10, 48)}
          <rect x={x + w - 34} y={flip ? y + 60 : y + 80} width="24" height="70" />
        </>
      );
    case "loft":
      return (
        <>
          <rect x={x + 8} y={flip ? by - 24 : by - 2} width={w * 0.45} height="100" strokeDasharray="5 4" />
          {bed(x + 18, 48)}
          <rect x={x + w - 34} y={flip ? y + 50 : y + 60} width="24" height="100" />
        </>
      );
    case "twobed":
      return (
        <>
          {bed(x + 10, 48)}
          {bed(x + w - 58, 48)}
          <line x1={x + w / 2} y1={flip ? y + 70 : y} x2={x + w / 2} y2={flip ? y + RD : y + RD - 70} />
        </>
      );
  }
}

function UnitShape({
  u,
  x,
  y,
  flip,
  dim,
  hot,
  selected,
  tone,
  onSelect,
  t,
}: {
  t?: Tier;
  u: Unit;
  x: number;
  y: number;
  flip: boolean;
  dim: boolean;
  hot: boolean;
  selected: boolean;
  tone: "light" | "dark";
  onSelect?: (u: Unit) => void;
}) {
  const w = u.span * COL;
  const ink = tone === "dark" ? "var(--paper)" : "var(--ink)";
  const ui = useT();
  const T = ui.floorMap;

  if (u.tier === "core") {
    return (
      <g stroke={ink} fill="none" strokeWidth="1" opacity="0.55">
        <rect x={x} y={y} width={w} height={RD} />
        <rect x={x + 12} y={y + 20} width={w - 24} height="70" />
        <path d={`M${x + 12} ${y + 20} l${w - 24} 70 M${x + w - 12} ${y + 20} l${-(w - 24)} 70`} />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={x + 12} y1={y + 110 + i * 11} x2={x + w - 12} y2={y + 110 + i * 11} />
        ))}
        <text x={x + 12} y={y + RD - 14} stroke="none" fill={ink} style={{ fontSize: 13, fontFamily: "var(--font-geist-mono)" }}>
          {T.stairLift}
        </text>
      </g>
    );
  }

  if (!t) return null;
  const fill = selected ? "var(--accent)" : hot ? "rgb(241 85 52 / 0.16)" : "transparent";
  const fg = selected ? "#fff" : ink;
  const label = (dy: number, text: string, size: number, opacity = 1, weight = 400) => (
    <text
      x={x + 12}
      y={flip ? y + 26 + dy : y + RD - 50 + dy}
      fill={fg}
      opacity={opacity}
      style={{ fontSize: size, fontWeight: weight, fontFamily: weight > 400 ? undefined : "var(--font-geist-mono)" }}
    >
      {text}
    </text>
  );

  const interactive = Boolean(onSelect);
  return (
    <g
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? fmt(T.roomAria, { id: u.id, name: t.name, status: T.status[u.status] }) : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={() => onSelect?.(u)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(u);
        }
      }}
      className={interactive ? "cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-accent" : undefined}
      style={{ opacity: dim ? 0.35 : 1, transition: "opacity .4s" }}
    >
      <rect x={x} y={y} width={w} height={RD} fill={fill} stroke={ink} strokeWidth="1.5" style={{ transition: "fill .3s" }} />
      {/* door to the corridor */}
      <g stroke={fg} fill="none" strokeWidth="1">
        <line x1={x + w - 54} y1={flip ? y : y + RD} x2={x + w - 14} y2={flip ? y : y + RD} stroke={tone === "dark" ? "var(--ink)" : "var(--paper)"} strokeWidth="4" />
        <path
          d={
            flip
              ? `M${x + w - 54} ${y} V${y + 40} A40 40 0 0 0 ${x + w - 14} ${y}`
              : `M${x + w - 54} ${y + RD} V${y + RD - 40} A40 40 0 0 1 ${x + w - 14} ${y + RD}`
          }
          strokeDasharray="3 3"
          opacity="0.7"
        />
      </g>
      <g fill="none" stroke={fg} strokeWidth="1" opacity={selected ? 0.9 : 0.5}>
        <Glyph tier={u.tier} x={x} y={y} w={w} flip={flip} />
      </g>
      {label(0, fmt(ui.units.room, { id: u.id }), 13, 0.75)}
      {label(20, t.short.toUpperCase(), u.span > 2 ? 19 : 15, 1, 700)}
      <rect
        x={x + w - 22}
        y={flip ? y + RD - 22 : y + 12}
        width="10"
        height="10"
        fill={u.status === "available" ? (selected ? "#fff" : "var(--accent)") : "none"}
        stroke={u.status === "let" ? "none" : selected ? "#fff" : "var(--accent)"}
        strokeWidth="1.5"
      >
        <title>{T.status[u.status]}</title>
      </rect>
    </g>
  );
}

export default function FloorMap({
  floor,
  highlight,
  selected,
  onSelect,
  onlyHighlight = false,
  tone = "light",
  className = "",
}: {
  floor: Floor;
  highlight?: TierId | null;
  selected?: string | null;
  onSelect?: (u: Unit) => void;
  onlyHighlight?: boolean; // fade the other units
  tone?: "light" | "dark";
  className?: string;
}) {
  const rooms = useRooms();
  const T = useT().floorMap;
  const ink = tone === "dark" ? "var(--paper)" : "var(--ink)";
  const rowOf = (units: Unit[], y: number, flip: boolean) => {
    let col = 0;
    // keyed by slot, not room id, so switching level updates the shapes in place instead of rebuilding them
    return units.map((u, i) => {
      const x = X0 + col * COL;
      col += u.span;
      const hot = Boolean(highlight && u.tier === highlight);
      return (
        <UnitShape
          key={`${flip ? "s" : "n"}${i}`}
          u={u}
          t={u.tier === "core" ? undefined : rooms?.tierById[u.tier]}
          x={x}
          y={y}
          flip={flip}
          hot={hot}
          dim={onlyHighlight && Boolean(highlight) && !hot && u.tier !== "core"}
          selected={selected === u.id}
          tone={tone}
          onSelect={onSelect}
        />
      );
    });
  };

  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className={className} role="img" aria-label={fmt(T.planAria, { floor: floor.name })}>
      {/* outer wall + window bands on the outside faces */}
      <rect x={X0 - 8} y={NY - 8} width={COL * 12 + 16} height={RD * 2 + CD + 16} fill="none" stroke={ink} strokeWidth="5" />
      <g stroke={ink} strokeWidth="1" opacity="0.5">
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i}>
            <line x1={X0 + i * COL + 25} y1={NY - 12} x2={X0 + i * COL + 75} y2={NY - 12} />
            <line x1={X0 + i * COL + 25} y1={SY + RD + 12} x2={X0 + i * COL + 75} y2={SY + RD + 12} />
          </g>
        ))}
      </g>
      <text
        x={X0 + COL * 3}
        y={CY + CD / 2 + 5}
        textAnchor="middle"
        fill={ink}
        opacity="0.45"
        style={{ fontSize: 13, letterSpacing: "0.4em", fontFamily: "var(--font-geist-mono)" }}
      >
        {fmt(T.corridor, { floor: floor.name.toUpperCase() })}
      </text>
      <path d={`M${X0 + 20} ${CY + CD / 2} H${X0 + COL * 1.4} M${X0 + COL * 4.6} ${CY + CD / 2} H${X0 + COL * 12 - 20}`} stroke={ink} opacity="0.35" strokeDasharray="2 8" />
      {rowOf(floor.north, NY, false)}
      {rowOf(floor.south, SY, true)}
      {/* north arrow */}
      <g transform={`translate(${MAP_W - 22} 22)`} stroke={ink} fill="none" opacity="0.7">
        <circle r="12" />
        <path d="M0 -8 L4 5 L0 2 L-4 5 Z" fill={ink} stroke="none" />
      </g>
    </svg>
  );
}
