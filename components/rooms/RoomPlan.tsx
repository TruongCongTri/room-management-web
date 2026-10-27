"use client";

/**
 * Furnished plan of one unit type, drawn to scale (S units per metre) in the
 * same heavy-wall drafting style as the home plan. North (windows) is up,
 * the corridor door is on the south wall.
 */
import { fmt, type Dictionary } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import type { TierId } from "@/lib/rooms";

const S = 50; // svg units per metre
const T = 0.16; // wall thickness, m
const M = 1.1; // margin for dimensions, m

const m = (v: number) => +(v * S).toFixed(1);

type Rm = [number, number, number, number]; // x, y, w, h in metres

function Walls({ rects }: { rects: Rm[] }) {
  return (
    <g fill="#3b3b3a" stroke="currentColor" strokeWidth="1">
      {rects.map(([x, y, w, h], i) => (
        <rect key={i} x={m(x)} y={m(y)} width={m(w)} height={m(h)} />
      ))}
    </g>
  );
}

/** Window in an outer wall: a gap with two thin glazing lines. */
function Win({ x, y, len, vertical = false }: { x: number; y: number; len: number; vertical?: boolean }) {
  const t = m(T);
  return vertical ? (
    <g>
      <rect x={m(x)} y={m(y)} width={t} height={m(len)} fill="var(--paper)" />
      <line x1={m(x) + t * 0.35} y1={m(y)} x2={m(x) + t * 0.35} y2={m(y + len)} stroke="currentColor" strokeWidth="0.8" />
      <line x1={m(x) + t * 0.65} y1={m(y)} x2={m(x) + t * 0.65} y2={m(y + len)} stroke="currentColor" strokeWidth="0.8" />
    </g>
  ) : (
    <g>
      <rect x={m(x)} y={m(y)} width={m(len)} height={t} fill="var(--paper)" />
      <line x1={m(x)} y1={m(y) + t * 0.35} x2={m(x + len)} y2={m(y) + t * 0.35} stroke="currentColor" strokeWidth="0.8" />
      <line x1={m(x)} y1={m(y) + t * 0.65} x2={m(x + len)} y2={m(y) + t * 0.65} stroke="currentColor" strokeWidth="0.8" />
    </g>
  );
}

/** Door: an opening cut in a wall plus the leaf and its swing. `rot` turns the swing (0 = opens up-right). */
function Door({ x, y, r, rot = 0, gap }: { x: number; y: number; r: number; rot?: number; gap: Rm }) {
  const R = m(r);
  return (
    <g>
      <rect x={m(gap[0])} y={m(gap[1])} width={m(gap[2])} height={m(gap[3])} fill="var(--paper)" />
      <path
        transform={`translate(${m(x)} ${m(y)}) rotate(${rot})`}
        d={`M0 0 L0 ${-R} A${R} ${R} 0 0 1 ${R} 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="3 3"
      />
    </g>
  );
}

function Bed({ x, y, w, h, pillows = 1, bunk = false, rot = false }: { x: number; y: number; w: number; h: number; pillows?: number; bunk?: boolean; rot?: boolean }) {
  // rot: headboard on the left instead of the top
  const pw = rot ? 0.32 : (w - 0.2 - (pillows - 1) * 0.08) / pillows;
  const ph = rot ? (h - 0.2 - (pillows - 1) * 0.08) / pillows : 0.32;
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(w)} height={m(h)} rx="2" />
      {Array.from({ length: pillows }, (_, i) =>
        rot ? (
          <rect key={i} x={m(x + 0.1)} y={m(y + 0.1 + i * (ph + 0.08))} width={m(pw)} height={m(ph)} rx="3" />
        ) : (
          <rect key={i} x={m(x + 0.1 + i * (pw + 0.08))} y={m(y + 0.1)} width={m(pw)} height={m(ph)} rx="3" />
        ),
      )}
      {rot ? (
        <path d={`M${m(x + w * 0.42)} ${m(y)} V${m(y + h)}`} />
      ) : (
        <path d={`M${m(x)} ${m(y + h * 0.42)} H${m(x + w)}`} />
      )}
      {bunk && <path d={`M${m(x)} ${m(y)} L${m(x + w)} ${m(y + h)}`} strokeDasharray="4 4" />}
    </g>
  );
}

function Desk({ x, y, w, h = 0.6, chair = "below" }: { x: number; y: number; w: number; h?: number; chair?: "below" | "above" | "none" }) {
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(w)} height={m(h)} />
      {chair !== "none" && <circle cx={m(x + w / 2)} cy={m(chair === "below" ? y + h + 0.28 : y - 0.28)} r={m(0.2)} />}
    </g>
  );
}

function Wardrobe({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const long = w > h;
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(w)} height={m(h)} />
      {long ? (
        <path d={`M${m(x)} ${m(y + h / 2)} H${m(x + w)}`} strokeDasharray="2 3" />
      ) : (
        <path d={`M${m(x + w / 2)} ${m(y)} V${m(y + h)}`} strokeDasharray="2 3" />
      )}
    </g>
  );
}

function Shower({ x, y, s = 0.9 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(s)} height={m(s)} />
      <path d={`M${m(x)} ${m(y)} L${m(x + s)} ${m(y + s)} M${m(x + s)} ${m(y)} L${m(x)} ${m(y + s)}`} opacity="0.5" />
      <circle cx={m(x + s / 2)} cy={m(y + s / 2)} r="3" />
    </g>
  );
}

function Wc({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(0.4)} height={m(0.18)} />
      <ellipse cx={m(x + 0.2)} cy={m(y + 0.45)} rx={m(0.18)} ry={m(0.26)} />
    </g>
  );
}

function Basin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(0.5)} height={m(0.4)} />
      <ellipse cx={m(x + 0.25)} cy={m(y + 0.2)} rx={m(0.16)} ry={m(0.12)} />
    </g>
  );
}

/** Kitchen run along a wall: counter, hob, sink, and an optional fridge square. */
function Kitchen({ x, y, len, vertical = false, fridge = true }: { x: number; y: number; len: number; vertical?: boolean; fridge?: boolean }) {
  const d = 0.6;
  const w = vertical ? d : len;
  const h = vertical ? len : d;
  const at = (t: number) => (vertical ? [x + d / 2, y + t] : [x + t, y + d / 2]);
  const [h1x, h1y] = at(0.4);
  const [h2x, h2y] = at(0.75);
  const [sx, sy] = at(len - (fridge ? 1.1 : 0.5));
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(w)} height={m(h)} />
      <circle cx={m(h1x)} cy={m(h1y)} r={m(0.12)} />
      <circle cx={m(h2x)} cy={m(h2y)} r={m(0.12)} />
      <rect x={m(sx - 0.2)} y={m(sy - 0.17)} width={m(0.4)} height={m(0.34)} rx="3" />
      {fridge &&
        (vertical ? (
          <g>
            <rect x={m(x)} y={m(y + len - 0.62)} width={m(d)} height={m(0.62)} />
            <path d={`M${m(x)} ${m(y + len - 0.62)} L${m(x + d)} ${m(y + len)}`} />
          </g>
        ) : (
          <g>
            <rect x={m(x + len - 0.62)} y={m(y)} width={m(0.62)} height={m(d)} />
            <path d={`M${m(x + len - 0.62)} ${m(y)} L${m(x + len)} ${m(y + d)}`} />
          </g>
        ))}
    </g>
  );
}

function Sofa({ x, y, w, h = 0.85 }: { x: number; y: number; w: number; h?: number }) {
  return (
    <g>
      <rect x={m(x)} y={m(y)} width={m(w)} height={m(h)} rx="4" />
      <rect x={m(x + 0.15)} y={m(y)} width={m(w - 0.3)} height={m(h - 0.22)} rx="3" />
    </g>
  );
}

function Dim({ a, b, at, label, vertical = false }: { a: number; b: number; at: number; label: string; vertical?: boolean }) {
  const A = m(a);
  const B = m(b);
  const P = m(at);
  return vertical ? (
    <g>
      <line x1={P} y1={A} x2={P} y2={B} />
      <line x1={P - 5} y1={A} x2={P + 5} y2={A} />
      <line x1={P - 5} y1={B} x2={P + 5} y2={B} />
      <text x={P - 7} y={(A + B) / 2} transform={`rotate(-90 ${P - 7} ${(A + B) / 2})`} textAnchor="middle" stroke="none" fill="currentColor">
        {label}
      </text>
    </g>
  ) : (
    <g>
      <line x1={A} y1={P} x2={B} y2={P} />
      <line x1={A} y1={P - 5} x2={A} y2={P + 5} />
      <line x1={B} y1={P - 5} x2={B} y2={P + 5} />
      <text x={(A + B) / 2} y={P - 7} textAnchor="middle" stroke="none" fill="currentColor">
        {label}
      </text>
    </g>
  );
}

const mm = (v: number) => String(Math.round(v * 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

type Label = keyof Dictionary["roomPlan"]["labels"];

type Layout = {
  w: number;
  d: number;
  walls: Rm[]; // interior partitions
  wins: { x: number; y: number; len: number; vertical?: boolean }[];
  doors: { x: number; y: number; r: number; rot?: number; gap: Rm }[];
  balcony?: Rm;
  furniture: React.ReactNode;
  labels: [Label, number, number][]; // worded by the locale (`ui.roomPlan.labels`)
  zone?: React.ReactNode; // overlays like the mezzanine outline
};

// hinge on the left jamb, leaf swinging up into the room
const southDoor = (x: number, d: number, w = 0.85): Layout["doors"][number] => ({ x, y: d, r: w, gap: [x, d, w, T] });

const LAYOUTS: Record<TierId, Layout> = {
  single: {
    w: 3,
    d: 4,
    walls: [
      [1.7, 2.6, T * 0.7, 1.4],
      [1.7, 2.6, 1.3, T * 0.7],
    ],
    wins: [{ x: 0.7, y: -T, len: 1.8 }],
    doors: [southDoor(0.3, 4), { x: 1.7 + T * 0.35, y: 3.1, r: 0.6, rot: 90, gap: [1.7, 3.1, T * 0.7, 0.65] }],
    furniture: (
      <>
        <Bed x={0.08} y={0.08} w={0.95} h={2.0} />
        <Desk x={1.5} y={0.08} w={1.42} />
        <Wardrobe x={0.08} y={2.3} w={0.6} h={0.95} />
        <Shower x={2.05} y={2.75} s={0.85} />
        <Wc x={2.2} y={3.6} />
        <Basin x={2.45} y={3.55} />
      </>
    ),
    labels: [
      ["room", 0.95, 1.5],
      ["bath", 2.0, 2.95],
    ],
  },
  studio: {
    w: 4,
    d: 5,
    walls: [
      [0, 3.3, 1.75, T * 0.7],
      [1.75, 3.3, T * 0.7, 1.7],
    ],
    wins: [{ x: 0.6, y: -T, len: 2.8 }],
    doors: [southDoor(2.1, 5), { x: 1.0, y: 3.3 + T * 0.35, r: 0.65, rot: 180, gap: [0.35, 3.3, 0.65, T * 0.7] }],
    furniture: (
      <>
        <Bed x={0.08} y={0.08} w={1.6} h={2.0} pillows={2} />
        <Desk x={2.5} y={0.08} w={1.42} />
        <Wardrobe x={0.08} y={2.5} w={1.2} h={0.6} />
        <Kitchen x={3.32} y={2.0} len={2.9} vertical />
        <Shower x={0.1} y={4.05} s={0.85} />
        <Wc x={1.15} y={3.5} />
        <Basin x={1.1} y={4.45} />
      </>
    ),
    labels: [
      ["studio", 1.9, 1.75],
      ["bath", 0.2, 3.65],
    ],
  },
  dorm: {
    w: 5.6,
    d: 5,
    walls: [
      [3.9, 3.3, T * 0.7, 1.7],
      [3.9, 3.3, 1.7, T * 0.7],
    ],
    wins: [{ x: 1.2, y: -T, len: 3.2 }],
    doors: [southDoor(2.3, 5), { x: 3.9 + T * 0.35, y: 3.95, r: 0.6, rot: 90, gap: [3.9, 3.95, T * 0.7, 0.65] }],
    furniture: (
      <>
        <Bed x={0.08} y={0.08} w={0.95} h={2.0} bunk />
        <Bed x={4.57} y={0.08} w={0.95} h={2.0} bunk />
        {[0, 1, 2, 3].map((i) => (
          <Desk key={i} x={1.25 + i * 0.78} y={0.08} w={0.72} h={0.55} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={m(0.08)} y={m(2.4 + i * 0.5)} width={m(0.55)} height={m(0.46)} />
        ))}
        <Shower x={4.65} y={3.5} s={0.85} />
        <Wc x={4.3} y={4.45} />
        <Basin x={4.05} y={3.45} />
      </>
    ),
    labels: [
      ["beds", 1.4, 2.0],
      ["lockers", 0.8, 3.2],
      ["bath", 4.1, 4.35],
    ],
  },
  loft: {
    w: 5.6,
    d: 5,
    walls: [
      [0, 3.5, 1.85, T * 0.7],
      [1.85, 3.5, T * 0.7, 1.5],
    ],
    wins: [{ x: 1.0, y: -T, len: 3.6 }],
    doors: [
      southDoor(2.4, 5),
      { x: 1.05, y: 3.5 + T * 0.35, r: 0.65, rot: 180, gap: [0.4, 3.5, 0.65, T * 0.7] },
      { x: 1.6, y: -T, r: 0.8, gap: [1.6, -T, 0.8, T] },
    ],
    balcony: [1.0, -1.25, 3.6, 1.1],
    furniture: (
      <>
        <Sofa x={3.15} y={2.45} w={1.65} />
        <rect x={m(3.45)} y={m(1.55)} width={m(1.05)} height={m(0.5)} />
        <Wardrobe x={0.08} y={0.25} w={0.42} h={1.9} />
        <Desk x={2.8} y={0.08} w={1.5} />
        <Kitchen x={4.92} y={0.9} len={2.7} vertical />
        {/* stair up to the mezzanine */}
        <g>
          <rect x={m(2.3)} y={m(1.25)} width={m(0.7)} height={m(2.1)} />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1={m(2.3)} y1={m(1.25 + (i + 1) * 0.26)} x2={m(3.0)} y2={m(1.25 + (i + 1) * 0.26)} />
          ))}
        </g>
        <Shower x={0.1} y={4.05} s={0.85} />
        <Wc x={1.25} y={3.72} />
        <Basin x={1.2} y={4.5} />
      </>
    ),
    zone: (
      <g>
        <rect x={m(0.05)} y={m(0.05)} width={m(2.2)} height={m(3.3)} fill="var(--accent)" fillOpacity="0.08" stroke="var(--accent)" strokeDasharray="6 4" strokeWidth="1.2" />
        <g fill="none" stroke="var(--accent)" strokeWidth="1">
          <Bed x={0.58} y={0.25} w={1.6} h={2.0} pillows={2} />
        </g>
      </g>
    ),
    labels: [
      ["mezzanine", 0.15, 3.15],
      ["living", 3.2, 3.75],
      ["balcony", 1.15, -0.55],
      ["bath", 0.2, 3.85],
    ],
  },
  twobed: {
    w: 7,
    d: 6,
    walls: [
      [3.2, 0, T * 0.7, 3.3],
      [0, 3.3, 3.2, T * 0.7],
      [4.2, 3.3, 2.8, T * 0.7],
      [4.2, 3.3, T * 0.7, 2.7],
      [1.8, 3.3, T * 0.7, 2.7],
    ],
    wins: [
      { x: 0.6, y: -T, len: 2.0 },
      { x: 3.9, y: -T, len: 2.6 },
      { x: 7, y: 3.9, len: 1.5, vertical: true },
    ],
    doors: [
      southDoor(2.0, 6),
      { x: 2.2, y: 3.3, r: 0.8, gap: [2.2, 3.3, 0.8, T * 0.7] },
      { x: 5.2, y: 3.3 + T * 0.7, r: 0.8, rot: 180, gap: [4.4, 3.3, 0.8, T * 0.7] },
      { x: 1.8 + T * 0.35, y: 4.3, r: 0.65, rot: 270, gap: [1.8, 3.6, T * 0.7, 0.7] },
      { x: 4.0, y: -T, r: 0.8, gap: [4.0, -T, 0.8, T] },
    ],
    balcony: [3.8, -1.25, 2.9, 1.1],
    furniture: (
      <>
        <Bed x={0.08} y={0.08} w={1.6} h={2.0} pillows={2} />
        <Desk x={1.9} y={0.08} w={1.2} />
        <Wardrobe x={0.08} y={2.55} w={1.3} h={0.6} />
        <Sofa x={3.7} y={2.3} w={2.2} />
        <rect x={m(4.2)} y={m(1.3)} width={m(1.2)} height={m(0.6)} />
        <Desk x={6.0} y={0.6} w={0.9} h={1.3} chair="none" />
        <Bed x={4.95} y={3.55} w={1.97} h={1.4} pillows={1} rot />
        <Wardrobe x={4.4} y={5.25} w={1.2} h={0.6} />
        <Kitchen x={3.55} y={3.6} len={2.3} vertical />
        <Shower x={0.1} y={3.55} s={0.85} />
        <Wc x={1.15} y={3.55} />
        <Basin x={0.15} y={5.45} />
        <g>
          <rect x={m(1.05)} y={m(5.25)} width={m(0.65)} height={m(0.65)} />
          <circle cx={m(1.375)} cy={m(5.575)} r={m(0.22)} />
        </g>
      </>
    ),
    labels: [
      ["bedroom1", 0.2, 2.35],
      ["living", 3.55, 1.0],
      ["bedroom2", 5.0, 5.2],
      ["kitchen", 2.05, 3.75],
      ["bath", 0.2, 4.85],
      ["balcony", 3.95, -0.55],
    ],
  },
};

export default function RoomPlan({
  tier,
  dims = true,
  labels = true,
  className = "",
  children,
}: {
  tier: TierId;
  dims?: boolean;
  labels?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const L = LAYOUTS[tier];
  const t = useT().roomPlan;
  const top = L.balcony ? 1.4 + M : M;
  const vb = `${m(-M)} ${m(-top)} ${m(L.w + 2 * M)} ${m(L.d + top + M)}`;
  const outer: Rm[] = [
    [-T, -T, L.w + 2 * T, T],
    [-T, L.d, L.w + 2 * T, T],
    [-T, 0, T, L.d],
    [L.w, 0, T, L.d],
  ];

  return (
    <svg viewBox={vb} className={`text-ink ${className}`} role="img" aria-label={fmt(t.aria, { w: L.w, d: L.d })}>
      {L.balcony && (
        <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <rect x={m(L.balcony[0])} y={m(L.balcony[1])} width={m(L.balcony[2])} height={m(L.balcony[3])} />
          <rect x={m(L.balcony[0] + 0.08)} y={m(L.balcony[1] + 0.08)} width={m(L.balcony[2] - 0.16)} height={m(L.balcony[3] - 0.1)} strokeDasharray="2 3" />
        </g>
      )}
      {L.zone}
      <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.62">
        {L.furniture}
      </g>
      <Walls rects={[...outer, ...L.walls]} />
      {L.wins.map((w, i) => (
        <Win key={i} {...w} />
      ))}
      {L.doors.map((d, i) => (
        <Door key={i} {...d} />
      ))}
      {labels && (
        <g fill="currentColor" opacity="0.6" style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }}>
          {L.labels.map(([k, x, y]) => (
            <text key={k} x={m(x)} y={m(y)}>
              {t.labels[k].toUpperCase()}
            </text>
          ))}
        </g>
      )}
      {dims && (
        <g stroke="currentColor" strokeWidth="0.7" opacity="0.5" style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }}>
          <Dim a={0} b={L.w} at={L.d + 0.65} label={mm(L.w)} />
          <Dim a={0} b={L.d} at={-0.6} label={mm(L.d)} vertical />
        </g>
      )}
      {children}
    </svg>
  );
}
