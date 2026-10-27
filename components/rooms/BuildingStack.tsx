"use client";

/**
 * The building as a stack of floor plates in oblique projection. Units of the
 * highlighted tier are filled; a floor can be picked. Each plate is the same
 * 12 × 2 grid as FloorMap, so a cell here is the same unit there.
 */
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import type { TierId, Unit } from "@/lib/rooms";

const CW = 30; // cell width
const CH = 36; // cell depth (before projection)
const GAP = 46; // vertical distance between plates
const SKEW = 0.55; // x shift per unit of depth
const SQUASH = 0.42; // depth foreshortening
const PW = CW * 12;
const PD = CH * 2 + 14; // two rows + corridor
const LEFT = 52;
const TOP = 26;

const project = (x: number, y: number, z: number) => [LEFT + x + (PD - y) * SKEW, TOP + z + y * SQUASH] as const;

function quad(x: number, y: number, w: number, d: number, z: number) {
  const pts = [project(x, y, z), project(x + w, y, z), project(x + w, y + d, z), project(x, y + d, z)];
  return pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
}

export const STACK_W = LEFT + PW + PD * SKEW + 64;

export default function BuildingStack({
  highlight,
  level,
  onLevel,
  selectedUnit,
  className = "",
}: {
  highlight?: TierId | null;
  level?: number | null;
  onLevel?: (level: number) => void;
  selectedUnit?: string | null;
  className?: string;
}) {
  const rooms = useRooms();
  const t = useT().floorMap;
  if (!rooms) return null;
  const { floors, ground } = rooms;
  const STACK_H = TOP + (floors.length + 1) * GAP + PD * SQUASH + 30;
  const row = (units: Unit[], y: number, z: number, active: boolean) => {
    let col = 0;
    return units.map((u) => {
      const x = col * CW;
      col += u.span;
      const hot = highlight && u.tier === highlight;
      const sel = selectedUnit === u.id;
      return (
        <polygon
          key={u.id}
          points={quad(x, y, u.span * CW, CH, z)}
          fill={sel ? "var(--ink)" : hot ? "var(--accent)" : u.tier === "core" ? "rgb(40 40 40 / 0.12)" : "var(--paper)"}
          fillOpacity={hot && !sel ? (active || level == null ? 1 : 0.55) : 1}
          stroke="var(--ink)"
          strokeWidth="0.8"
          style={{ transition: "fill .4s, fill-opacity .4s" }}
        />
      );
    });
  };

  return (
    <svg viewBox={`0 0 ${STACK_W.toFixed(0)} ${STACK_H.toFixed(0)}`} className={`text-ink ${className}`} role="group" aria-label={t.stackAria}>
      {/* core shaft running through every plate */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.35" strokeDasharray="3 3">
        {[0, 1].map((k) => {
          const [x1, y1] = project(4 * CW + k * 2 * CW, PD, 0);
          const [x2, y2] = project(4 * CW + k * 2 * CW, PD, floors.length * GAP);
          return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {[...floors].reverse().map((f, i) => {
        // drawn bottom-up so upper plates overlap the ones below
        const zz = (floors.length - 1 - i) * GAP;
        const active = level === f.level;
        const has = highlight ? [...f.north, ...f.south].some((u) => u.tier === highlight) : false;
        const [lx, ly] = project(0, PD, zz);
        const [rx, ry] = project(PW, 0, zz);
        const interactive = Boolean(onLevel);
        return (
          <g
            key={f.level}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${f.name}` : undefined}
            aria-pressed={interactive ? active : undefined}
            onClick={() => onLevel?.(f.level)}
            onKeyDown={(e) => {
              if (onLevel && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onLevel(f.level);
              }
            }}
            className={interactive ? "group cursor-pointer outline-none" : undefined}
            style={{ transform: active ? "translateX(-10px)" : undefined, transition: "transform .5s cubic-bezier(.23,1,.32,1)" }}
          >
            {/* slab edge */}
            <polygon
              points={`${project(0, PD, zz).join(",")} ${project(PW, PD, zz).join(",")} ${project(PW, PD, zz + 6).join(",")} ${project(0, PD, zz + 6).join(",")}`}
              fill={active ? "var(--accent)" : "var(--ink)"}
              opacity={active ? 1 : 0.8}
            />
            <polygon points={quad(0, 0, PW, PD, zz)} fill="var(--paper)" stroke="var(--ink)" strokeWidth={active ? 1.6 : 1} className="group-focus-visible:stroke-accent" />
            {row(f.north, 0, zz, active)}
            {row(f.south, CH + 14, zz, active)}
            <text x={lx - 10} y={ly + 4} textAnchor="end" fill={active ? "var(--accent)" : "currentColor"} style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)" }}>
              L{f.level}
            </text>
            {has && (
              <text x={rx + 10} y={ry + 6} fill="var(--accent)" style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }}>
                ●{" "}
                {[...f.north, ...f.south].filter((u) => u.tier === highlight).length}
              </text>
            )}
          </g>
        );
      })}

      {/* ground floor: lobby, parking, laundry */}
      {(() => {
        const zz = floors.length * GAP;
        const [lx, ly] = project(0, PD, zz);
        return (
          <g>
            <polygon
              points={`${project(0, PD, zz).join(",")} ${project(PW, PD, zz).join(",")} ${project(PW, PD, zz + 6).join(",")} ${project(0, PD, zz + 6).join(",")}`}
              fill="var(--ink)"
              opacity="0.5"
            />
            <polygon points={quad(0, 0, PW, PD, zz)} fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="1" strokeDasharray="4 3" />
            <text x={lx - 10} y={ly + 4} textAnchor="end" fill="currentColor" opacity="0.6" style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)" }}>
              G
            </text>
            <text x={lx + 8} y={ly + 26} fill="currentColor" opacity="0.6" style={{ fontSize: 10, fontFamily: "var(--font-geist-mono)" }}>
              {ground.text.toUpperCase()}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
