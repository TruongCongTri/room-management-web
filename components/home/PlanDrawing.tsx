"use client";

import { useT } from "@/i18n/I18nProvider";

/**
 * Level-three residential plan (studios, singles, lounge, shared kitchen) in heavy-wall drafting style.
 * Each layer (outline, wall fill, furniture, dimensions) can be dialled 0–1
 * so the scroll story can assemble it piece by piece.
 * viewBox 0 0 640 720.
 */

export const PLAN_W = 640;
export const PLAN_H = 720;

type R = [number, number, number, number];

const WALLS: R[] = [
  // outer
  [60, 60, 150, 14], [250, 60, 170, 14], [480, 60, 100, 14],
  [60, 60, 14, 120], [60, 230, 14, 150], [60, 430, 14, 250],
  [566, 60, 14, 200], [566, 310, 14, 160], [566, 520, 14, 160],
  [60, 666, 120, 14], [230, 666, 170, 14], [450, 666, 130, 14],
  // interior
  [74, 250, 216, 14], [330, 250, 236, 14],
  [300, 74, 14, 136],
  [420, 264, 14, 90], [420, 400, 14, 80],
  [434, 370, 132, 14],
  [74, 480, 126, 14], [240, 480, 326, 14],
  [200, 494, 14, 110],
  [420, 540, 14, 126],
];

// window gaps in the outer wall: [x1, y1, x2, y2]
const WINDOWS: R[] = [
  [210, 67, 250, 67], [420, 67, 480, 67],
  [67, 180, 67, 230], [67, 380, 67, 430],
  [573, 260, 573, 310], [573, 470, 573, 520],
  [180, 673, 230, 673], [400, 673, 450, 673],
];

const DOORS: { x: number; y: number; r: number; rot: number }[] = [
  { x: 290, y: 264, r: 40, rot: 0 },
  { x: 314, y: 210, r: 40, rot: 90 },
  { x: 420, y: 354, r: 46, rot: 0 },
  { x: 200, y: 494, r: 40, rot: 0 },
  { x: 214, y: 604, r: 52, rot: 270 },
];

// room labels, in the order of `ui.drawings.planRooms` in the locale files
const ROOMS: { x: number; y: number }[] = [
  { x: 86, y: 96 },
  { x: 328, y: 96 },
  { x: 86, y: 290 },
  { x: 446, y: 290 },
  { x: 446, y: 404 },
  { x: 86, y: 516 },
  { x: 226, y: 516 },
  { x: 446, y: 516 },
];

function Bed({ x, y, w, h, pillows = 1 }: { x: number; y: number; w: number; h: number; pillows?: number }) {
  const pw = (w - 8 - (pillows - 1) * 4) / pillows;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" />
      {Array.from({ length: pillows }, (_, i) => (
        <rect key={i} x={x + 4 + i * (pw + 4)} y={y + 4} width={pw} height="14" rx="2" />
      ))}
      <line x1={x} y1={y + h * 0.4} x2={x + w} y2={y + h * 0.4} />
    </g>
  );
}

function Hob({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const vertical = h > w;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} />
      <circle cx={vertical ? x + w / 2 : x + 14} cy={vertical ? y + 14 : y + h / 2} r="6" />
      <circle cx={vertical ? x + w / 2 : x + 32} cy={vertical ? y + 32 : y + h / 2} r="6" />
    </g>
  );
}

function Furniture() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55">
      {/* RM 303 studio: double bed, desk, kitchenette */}
      <Bed x={86} y={110} w={84} h={104} pillows={2} />
      <rect x="190" y="80" width="70" height="22" />
      <circle cx="225" cy="114" r="7" />
      <Hob x={272} y={120} w={22} h={110} />
      {/* RM 304 studio */}
      <Bed x={470} y={110} w={84} h={104} pillows={2} />
      <rect x="340" y="110" width="70" height="22" />
      <circle cx="375" cy="144" r="7" />
      <Hob x={330} y={214} w={110} h={22} />
      {/* lounge: two sofas around a table */}
      <rect x="110" y="320" width="130" height="28" rx="4" />
      <rect x="110" y="420" width="130" height="28" rx="4" />
      <rect x="145" y="364" width="60" height="40" />
      <rect x="300" y="330" width="90" height="56" rx="20" />
      {/* single rooms: bed + desk */}
      {[278, 392].map((y) => (
        <g key={y}>
          <Bed x={512} y={y + 4} w={42} h={74} />
          <rect x="446" y={y + 52} width="50" height="22" />
        </g>
      ))}
      <Bed x={86} y={540} w={44} h={78} />
      <rect x="140" y="634" width="52" height="22" />
      {/* RM 308 studio */}
      <Bed x={322} y={548} w={86} h={104} pillows={2} />
      <rect x="236" y="632" width="70" height="22" />
      {/* shared kitchen */}
      <rect x="538" y="500" width="24" height="150" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="538" y1={530 + i * 30} x2="562" y2={530 + i * 30} />
      ))}
      <rect x="460" y="590" width="60" height="40" />
      <path d="M460 590 L520 630 M520 590 L460 630" />
    </g>
  );
}

function Dim({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - 5} y1={y1} x2={x1 + 5} y2={y1} />
          <line x1={x2 - 5} y1={y2} x2={x2 + 5} y2={y2} />
          <line x1={x1 - 3} y1={y1 + 3} x2={x1 + 3} y2={y1 - 3} />
          <line x1={x2 - 3} y1={y2 + 3} x2={x2 + 3} y2={y2 - 3} />
          <text x={mx - 6} y={my} transform={`rotate(-90 ${mx - 6} ${my})`} textAnchor="middle" stroke="none" fill="currentColor">
            {label}
          </text>
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 5} x2={x1} y2={y1 + 5} />
          <line x1={x2} y1={y2 - 5} x2={x2} y2={y2 + 5} />
          <line x1={x1 - 3} y1={y1 + 3} x2={x1 + 3} y2={y1 - 3} />
          <line x1={x2 - 3} y1={y2 + 3} x2={x2 + 3} y2={y2 - 3} />
          <text x={mx} y={my - 6} textAnchor="middle" stroke="none" fill="currentColor">
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export default function PlanDrawing({
  outline = 1,
  fill = 1,
  furniture = 1,
  dims = 1,
  className = "",
  children,
}: {
  outline?: number;
  fill?: number;
  furniture?: number;
  dims?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useT().drawings;
  return (
    <svg viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} className={`text-ink ${className}`} role="img" aria-label={t.plan}>
      {/* windows */}
      <g stroke="currentColor" strokeWidth="1" opacity={0.45 * Math.max(fill, furniture)}>
        {WINDOWS.map(([x1, y1, x2, y2], i) =>
          x1 === x2 ? (
            <g key={i}>
              <line x1={x1 - 5} y1={y1} x2={x2 - 5} y2={y2} />
              <line x1={x1 + 5} y1={y1} x2={x2 + 5} y2={y2} />
            </g>
          ) : (
            <g key={i}>
              <line x1={x1} y1={y1 - 5} x2={x2} y2={y2 - 5} />
              <line x1={x1} y1={y1 + 5} x2={x2} y2={y2 + 5} />
            </g>
          ),
        )}
      </g>

      {/* walls: pieces fly in from outside and lock into place, then fill */}
      <g>
        {WALLS.map(([x, y, w, h], i) => {
          const start = (i / WALLS.length) * 0.45;
          const t = Math.min(1, Math.max(0, (outline - start) / 0.55));
          const e = 1 - Math.pow(1 - t, 3);
          const dx = (x + w / 2 - PLAN_W / 2) * 0.55 * (1 - e);
          const dy = (y + h / 2 - PLAN_H / 2) * 0.55 * (1 - e);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              transform={dx || dy ? `translate(${dx.toFixed(1)} ${dy.toFixed(1)})` : undefined}
              fill="#3b3b3a"
              fillOpacity={fill}
              stroke="currentColor"
              strokeWidth="1"
              opacity={t}
            />
          );
        })}
      </g>

      {/* doors */}
      <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity={0.55 * furniture}>
        {DOORS.map((d, i) => (
          <path
            key={i}
            transform={`translate(${d.x} ${d.y}) rotate(${d.rot})`}
            d={`M0 0 L${d.r} 0 M0 0 L0 ${d.r} A${d.r} ${d.r} 0 0 0 ${d.r} 0`}
          />
        ))}
      </g>

      <g style={{ opacity: furniture }}>
        <Furniture />
        <g className="t-mono-xs" fill="currentColor" opacity="0.6" style={{ fontSize: 10 }}>
          {ROOMS.map((r, i) => (
            <text key={i} x={r.x} y={r.y}>
              {t.planRooms[i]?.toUpperCase()}
            </text>
          ))}
        </g>
      </g>

      {/* dimensions */}
      <g
        stroke="currentColor"
        strokeWidth="0.7"
        opacity={0.5 * dims}
        className="t-mono-xs"
        style={{ fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
      >
        <Dim x1={60} y1={34} x2={300} y2={34} label="6 200" />
        <Dim x1={300} y1={34} x2={580} y2={34} label="7 000" />
        <Dim x1={60} y1={14} x2={580} y2={14} label="13 200" />
        <Dim x1={36} y1={60} x2={36} y2={257} label="4 400" vertical />
        <Dim x1={36} y1={257} x2={36} y2={487} label="5 400" vertical />
        <Dim x1={36} y1={487} x2={36} y2={680} label="5 000" vertical />
        <Dim x1={60} y1={704} x2={207} y2={704} label="3 500" />
        <Dim x1={207} y1={704} x2={427} y2={704} label="5 400" />
        <Dim x1={427} y1={704} x2={580} y2={704} label="4 000" />
        <Dim x1={612} y1={60} x2={612} y2={377} label="7 800" vertical />
        <Dim x1={612} y1={377} x2={612} y2={680} label="7 600" vertical />
      </g>

      {children}
    </svg>
  );
}
