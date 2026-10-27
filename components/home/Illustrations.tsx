/** Home page illustrations, drawn in one drafting style: linework first, render on top. */
import { InkMask } from "../fx/Ink";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Stipple({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={`${id}-dots`} width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="#282828" opacity="0.22" />
        <circle cx="1" cy="1" r="0.8" fill="#282828" opacity="0.6" />
      </pattern>
      <pattern id={`${id}-light`} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#e6e4de" />
        <circle cx="1" cy="1" r="0.55" fill="#282828" opacity="0.35" />
        <circle cx="3" cy="3" r="0.4" fill="#282828" opacity="0.2" />
      </pattern>
    </defs>
  );
}

/* --------------------------------------------------------------------- tower */

function TowerLayer({ render, id }: { render: boolean; id: string }) {
  const L = { tx: 140, ty: 190, bx: 140, by: 610 };
  const C = { tx: 250, ty: 150, bx: 250, by: 640 };
  const R = { tx: 410, ty: 205, bx: 410, by: 612 };
  const fins = Array.from({ length: 18 }, (_, i) => (i + 0.5) / 18);
  const floors = Array.from({ length: 13 }, (_, i) => (i + 1) / 14);
  const f = (v: string) => (render ? v : "none");

  return (
    <g fill="none" stroke="#282828" strokeWidth="1">
      {render && <circle cx="440" cy="250" r="122" fill="var(--accent)" stroke="none" />}
      <path d="M300 130 L470 200 L470 430 M300 130 L300 160 M330 140 L330 420 M360 152 L360 425 M440 186 L440 428" opacity="0.7" />
      <path d={`M${L.tx} ${L.ty} L${C.tx} ${C.ty} L${C.bx} ${C.by} L${L.bx} ${L.by} Z`} fill={f(`url(#${id}-light)`)} />
      {render && (
        <path
          d={`M${L.tx} ${L.ty} L${C.tx} ${C.ty} L${C.tx} ${lerp(C.ty, C.by, 0.5)} L${L.tx} ${lerp(L.ty, L.by, 0.5)} Z`}
          fill={`url(#${id}-dots)`}
          stroke="none"
          opacity="0.45"
        />
      )}
      {floors.map((t) => (
        <line key={t} x1={L.tx} y1={lerp(L.ty, L.by, t)} x2={C.tx} y2={lerp(C.ty, C.by, t)} opacity="0.6" />
      ))}
      <path d={`M${C.tx} ${C.ty} L${R.tx} ${R.ty} L${R.bx} ${R.by} L${C.bx} ${C.by} Z`} fill={f("#f1f0eb")} />
      {render && (
        <path
          d={`M${C.tx} ${C.ty} L${R.tx} ${R.ty} L${R.tx} ${lerp(R.ty, R.by, 0.48)} L${C.tx} ${lerp(C.ty, C.by, 0.5)} Z`}
          fill={`url(#${id}-dots)`}
          stroke="none"
        />
      )}
      {fins.map((t) => {
        const x = lerp(C.tx, R.tx, t);
        return <line key={t} x1={x} y1={lerp(C.ty, R.ty, t)} x2={x} y2={lerp(C.by, R.by, t)} />;
      })}
      <path d="M0 560 L120 560 L420 618 L420 690 L0 640 Z" fill={f("#f3f2ee")} />
      <path d="M0 640 L420 690 L720 660 M420 618 L720 600 M120 560 L120 600" />
      <path d="M190 620 L190 680 M260 630 L260 686 M330 640 L330 690" opacity="0.6" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={430 + i * 4} y1={672 + i * 5} x2={640 - i * 6} y2={650 + i * 5} opacity="0.7" />
      ))}
      <line x1="0" y1="720" x2="720" y2="700" />
    </g>
  );
}

/** Residential tower: linework by default, the render bleeds in as `reveal` goes 0 → 1. */
export function Tower({ reveal = 1, id = "tower", className = "" }: { reveal?: number; id?: string; className?: string }) {
  return (
    <svg viewBox="0 0 720 720" className={className} aria-hidden="true">
      <Stipple id={id} />
      <InkMask id={`${id}-ink`} w={720} h={720} p={reveal} rough={90} />
      <TowerLayer render={false} id={id} />
      <g mask={`url(#${id}-ink)`}>
        <TowerLayer render id={id} />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------- problem icons */

function iconShapes(n: number, mask: boolean) {
  const s = 22;
  const iso = (x: number, y: number, z: number) => {
    const px = 100 + (x - y) * Math.cos(Math.PI / 6) * s;
    const py = 95 + (x + y) * Math.sin(Math.PI / 6) * s - z * s;
    return `${px.toFixed(1)} ${py.toFixed(1)}`;
  };
  // in mask mode every stroke draws on with pathLength 1, so dash patterns are dropped
  const P = ({ d, dashed, w, o }: { d: string; dashed?: boolean; w?: number; o?: number }) => (
    <path
      d={d}
      pathLength={mask ? 1 : undefined}
      strokeDasharray={!mask && dashed ? "4 4" : undefined}
      strokeWidth={mask ? 7 : w}
      opacity={mask ? 1 : o}
    />
  );
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, dashed = false) => (
    <>
      <P dashed={dashed} d={`M${iso(x, y, z + h)} L${iso(x + w, y, z + h)} L${iso(x + w, y + d, z + h)} L${iso(x, y + d, z + h)} Z`} />
      <P dashed={dashed} d={`M${iso(x, y + d, z + h)} L${iso(x, y + d, z)} L${iso(x + w, y + d, z)} L${iso(x + w, y, z)} L${iso(x + w, y, z + h)}`} />
      <P dashed={dashed} d={`M${iso(x + w, y + d, z)} L${iso(x + w, y + d, z + h)}`} />
    </>
  );
  const circle = (cx: number, cy: number, rr: number, dashed = false) => (
    <P dashed={dashed} d={`M${cx - rr} ${cy} a${rr} ${rr} 0 1 0 ${rr * 2} 0 a${rr} ${rr} 0 1 0 ${-rr * 2} 0`} />
  );

  if (n === 0)
    return (
      <>
        {box(-1.5, -1.5, 0, 3, 3, 0.15)}
        {box(-1.5, -1.5, 0.5, 3, 3, 0.15, true)}
        {box(-1.5, -1.5, 1, 3, 3, 0.15)}
        <P d={`M${iso(0.2, -0.4, 1.15)} L${iso(1, 0.6, 2.4)}`} w={2} />
        <P d={`M${iso(-1, -0.8, 1.15)} L${iso(0.6, -0.8, 1.15)} M${iso(-1, -0.3, 1.15)} L${iso(0.2, -0.3, 1.15)}`} o={0.6} />
      </>
    );
  if (n === 1)
    return (
      <>
        {box(-2.4, -0.6, 0, 1.4, 1.4, 1.4)}
        {box(1.0, -0.6, 0, 1.4, 1.4, 1.4)}
        <P d={`M${iso(-1, 0.1, 0.7)} L${iso(-0.25, 0.1, 0.7)} M${iso(0.25, 0.1, 0.7)} L${iso(1, 0.1, 0.7)}`} />
        <P d={`M${iso(-0.25, 0.1, 0.95)} L${iso(0.25, 0.1, 0.45)}`} o={0.6} />
      </>
    );
  if (n === 2)
    return (
      <>
        {circle(100, 95, 78)}
        {box(-1.1, -1.1, -1, 2.2, 2.2, 2, true)}
        <P d={`M${iso(0, 0, 1)} L${iso(0, 0, -1)}`} dashed o={0.6} />
      </>
    );
  return (
    <>
      {box(-1, -1, 0.9, 2, 2, 0.25)}
      {box(-1, -1, 1.15, 0.25, 2, 1.6)}
      <P
        d={`M${iso(-0.9, -0.9, 0.9)} L${iso(-0.9, -0.9, -0.6)} M${iso(0.9, -0.9, 0.9)} L${iso(0.9, -0.9, -0.6)} M${iso(0.9, 0.9, 0.9)} L${iso(0.9, 0.9, -0.6)} M${iso(-0.9, 0.9, 0.9)} L${iso(-0.9, 0.9, -0.6)}`}
      />
      {circle(112, 30, 12, true)}
      <P d="M92 70 Q112 44 132 70" dashed o={0.7} />
    </>
  );
}

/** Isometric problem icon: grey at rest, redrawn in ink on card hover. */
export function IsoIcon({ n, className = "" }: { n: 0 | 1 | 2 | 3; className?: string }) {
  const id = `iso-${n}`;
  return (
    <svg viewBox="0 0 200 190" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="190">
          <g className="draw-mask" stroke="#fff" fill="none" strokeLinecap="round">
            {iconShapes(n, true)}
          </g>
        </mask>
      </defs>
      <g className="text-ink/30">{iconShapes(n, false)}</g>
      <g className="text-ink" mask={`url(#${id})`} strokeWidth="1.3">
        {iconShapes(n, false)}
      </g>
    </svg>
  );
}

/* ----------------------------------------------------------------- colonnade */

/** Long colonnaded slab in perspective. */
export function Colonnade({ className = "", id = "col" }: { className?: string; id?: string }) {
  const cols = [0.12, 0.35, 0.62, 0.92];
  const top = (t: number) => ({ x: lerp(720, 160, t), y: lerp(140, 390, t) });
  const bot = (t: number) => ({ x: lerp(720, 160, t), y: lerp(250, 420, t) });
  return (
    <svg viewBox="0 0 720 720" className={className} aria-hidden="true">
      <Stipple id={id} />
      <g fill="none" stroke="#282828" strokeWidth="1">
        <path d="M0 450 L60 430 L110 445 L170 420 L240 445 L320 432 L420 452" fill="#cfcdc7" stroke="none" />
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={470 + i * i * 3.2} x2="720" y2={460 + i * i * 3.4} opacity="0.5" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={60 + i * 50} y1="470" x2={-400 + i * 150} y2="720" opacity="0.5" />
        ))}
        <path d={`M${top(0).x} ${top(0).y} L${top(1).x} ${top(1).y} L${bot(1).x} ${bot(1).y} L${bot(0).x} ${bot(0).y} Z`} fill="#ebe9e3" />
        <path d={`M${top(0).x} ${top(0).y + 30} L${top(1).x} ${top(1).y + 8}`} />
        <path d={`M${bot(0).x} ${bot(0).y - 34} L${bot(1).x} ${bot(1).y - 9} L${bot(1).x} ${bot(1).y} L${bot(0).x} ${bot(0).y} Z`} fill={`url(#${id}-dots)`} />
        <path d={`M${bot(0).x} ${bot(0).y} L${bot(1).x} ${bot(1).y} L${bot(1).x} 470 L720 520 Z`} fill={`url(#${id}-dots)`} opacity="0.85" />
        {cols.map((t) => {
          const b = bot(t);
          const w = lerp(70, 18, t);
          const foot = lerp(540, 466, t);
          return <path key={t} d={`M${b.x - w} ${b.y} L${b.x} ${b.y} L${b.x} ${foot} L${b.x - w} ${foot - 4} Z`} fill="#e3e1db" />;
        })}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={200 + i * 14} y1={500 - i * 4} x2={420 + i * 6} y2={520 - i * 5} opacity="0.7" />
        ))}
        <path d="M280 532 L280 506 M276 516 L284 516" strokeWidth="3" />
        <circle cx="280" cy="502" r="3" fill="#282828" />
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------------- civic */

function CivicTree({ x, y, s, id }: { x: number; y: number; s: number; id: string }) {
  return (
    <g>
      <path d={`M${x} ${y} V${y - 14 * s}`} stroke="#282828" strokeWidth={1.2} />
      {[
        [0, -24, 12],
        [-8, -18, 9],
        [8, -18, 9],
        [0, -32, 8],
      ].map(([dx, dy, rr], i) => (
        <circle key={i} cx={x + dx * s} cy={y + dy * s} r={rr * s} fill={`url(#${id}-dots)`} stroke="none" opacity={0.9} />
      ))}
    </g>
  );
}

function CivicLayer({ render, id }: { render: boolean; id: string }) {
  const f = (v: string) => (render ? v : "none");
  return (
    <g fill="none" stroke="#282828" strokeWidth="1">
      {render && <circle cx="460" cy="70" r="40" fill="var(--accent)" stroke="none" />}
      <path d="M180 40 H500 M120 300 H560 M210 30 V320 M430 30 V320" opacity="0.3" />
      <path d="M240 80 H300 V60 H340 V80 H400 V150 H430 V220 H210 V150 H240 Z" fill={f(`url(#${id}-light)`)} />
      {render && <path d="M240 80 H300 V150 H240 Z M340 80 H400 V150 H340 Z" fill={`url(#${id}-dots)`} stroke="none" opacity="0.5" />}
      {render && <path d="M400 150 H430 V220 H400 Z" fill={`url(#${id}-dots)`} stroke="none" />}
      {render && <rect x="200" y="196" width="40" height="30" fill="var(--accent)" stroke="none" />}
      <circle cx="320" cy="170" r="42" fill={f(`url(#${id}-dots)`)} />
      <circle cx="320" cy="170" r="30" fill={f("#282828")} />
      <circle cx="320" cy="170" r="18" opacity={render ? 0 : 1} />
      <path d="M170 222 H470 V232 H170 Z" fill={f("#ebe9e3")} />
      <path d="M190 232 V290 M450 232 V290 M250 232 V280 M390 232 V280" />
      <path d="M300 222 L250 330 M340 222 L390 330" />
      {Array.from({ length: 12 }, (_, i) => {
        const y = 230 + i * 8.5;
        const half = 22 + i * 4.2;
        return <line key={i} x1={320 - half} y1={y} x2={320 + half} y2={y} opacity="0.75" />;
      })}
      <path d="M60 330 H580" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={320} y1={232} x2={40 + i * 70} y2={380} opacity="0.25" />
      ))}
      <path d="M100 350 H540 M80 368 H560" opacity="0.4" />
      {render && (
        <>
          <CivicTree id={id} x={150} y={330} s={1.4} />
          <CivicTree id={id} x={200} y={334} s={1} />
          <CivicTree id={id} x={470} y={334} s={1.1} />
          <CivicTree id={id} x={520} y={330} s={1.5} />
          <path d="M316 318 V302 M313 309 H319" strokeWidth="2.4" />
          <circle cx="316" cy="299" r="2.4" fill="#282828" />
        </>
      )}
    </g>
  );
}

/** Stepped civic building: linework, then the render bleeds in with `reveal`. */
export function Civic({ reveal = 1, id = "civic", className = "" }: { reveal?: number; id?: string; className?: string }) {
  return (
    <svg viewBox="0 0 640 380" className={className} aria-hidden="true">
      <Stipple id={id} />
      <InkMask id={`${id}-ink`} w={640} h={380} p={reveal} rough={70} seed={9} />
      <CivicLayer render={false} id={id} />
      <g mask={`url(#${id}-ink)`}>
        <CivicLayer render id={id} />
      </g>
    </svg>
  );
}
