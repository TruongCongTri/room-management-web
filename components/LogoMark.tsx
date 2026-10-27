/** Isometric block with an open court cut into the top: the Atrium mark. */
export default function LogoMark({ className = "", strokeWidth = 6 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 100 110" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" aria-hidden="true">
      <path d="M50 5 L93 30 L93 80 L50 105 L7 80 L7 30 Z" />
      <path d="M7 30 L50 55 L93 30 M50 55 L50 105" />
      <path d="M50 18 L71 30 L50 42 L29 30 Z" />
      <path d="M29 30 L29 40 L50 52 L50 42" />
    </svg>
  );
}
