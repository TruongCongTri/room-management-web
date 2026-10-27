/**
 * SVG "ink" reveal: a mask whose leading edge is roughened with turbulence,
 * so a rendered layer bleeds in over the linework like ink soaking paper.
 * Put <InkMask/> inside an <svg>, then wrap the layer in <g mask={`url(#${id})`}>.
 */
export function InkMask({
  id,
  w,
  h,
  p,
  rough = 70,
  from = "top",
  seed = 4,
}: {
  id: string;
  w: number;
  h: number;
  /** 0–1 reveal amount. */
  p: number;
  rough?: number;
  from?: "top" | "bottom";
  seed?: number;
}) {
  const span = h + rough * 2;
  const height = span * Math.min(1, Math.max(0, p)) * 1.04;
  const y = from === "top" ? -rough : h + rough - height;
  return (
    <defs>
      <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={-rough * 2} y={-rough * 2} width={w + rough * 4} height={h + rough * 4}>
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={rough} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <mask id={id} maskUnits="userSpaceOnUse" x={-rough * 2} y={-rough * 2} width={w + rough * 4} height={h + rough * 4}>
        {height > 0 && (
          <rect x={-rough * 2} y={y} width={w + rough * 4} height={height} fill="#fff" filter={`url(#${id}-f)`} />
        )}
      </mask>
    </defs>
  );
}
