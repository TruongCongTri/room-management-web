"use client";

import { useRef, useState, type PointerEvent } from "react";

const W = 1400;
const H = 300;
const TEXT = { fontSize: 290, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "var(--font-inter-tight)" };

function Word(props: React.SVGProps<SVGTextElement>) {
  return (
    <text x="700" y="250" textAnchor="middle" textLength="1340" lengthAdjust="spacingAndGlyphs" style={TEXT} {...props}>
      ATRIUM
    </text>
  );
}

/** Construction-line wordmark; an ink blot follows the cursor and fills the letters. */
export default function FooterWordmark() {
  const svg = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: W / 2, y: H / 2 });
  const [over, setOver] = useState(false);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    setPt({ x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H });
  };

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      aria-label="Atrium"
      onPointerMove={onMove}
      onPointerEnter={() => setOver(true)}
      onPointerLeave={() => setOver(false)}
    >
      <defs>
        <filter id="wm-ink" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id="wm-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <circle
            cx={pt.x}
            cy={pt.y}
            fill="#fff"
            filter="url(#wm-ink)"
            style={{ r: over ? 150 : 0, transition: "r 0.6s cubic-bezier(.23,1,.32,1)" } as React.CSSProperties}
          />
        </mask>
      </defs>

      <g stroke="var(--ink)" strokeWidth="0.75" opacity="0.5">
        {[40, 250].map((y) => (
          <line key={y} x1="0" x2={W} y1={y} y2={y} strokeDasharray="2 6" />
        ))}
        {[0, 233, 466, 700, 933, 1166, 1400].map((x) => (
          <g key={x}>
            <line x1={x} x2={x} y1="30" y2="50" />
            <line x1={x} x2={x} y1="240" y2="260" />
          </g>
        ))}
      </g>
      {/* stroked copy under a paper-filled copy = clean outline without glyph overlaps */}
      <Word fill="none" stroke="var(--ink)" strokeWidth={2.6} />
      <Word fill="var(--paper)" />
      <g mask="url(#wm-mask)">
        <Word fill="var(--ink)" />
      </g>
    </svg>
  );
}
