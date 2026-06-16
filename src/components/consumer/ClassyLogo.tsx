/**
 * Brand mark — nested double-arc "U" (the Classy Cocktails / Aitemz logo).
 * Drawn as two concentric arc bands so it stays crisp at any size.
 */
export function ClassyLogo({ size = 24, color = '#1a1a1a' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer band */}
      <path
        d="M33.03 12.02 A 15 15 0 1 1 14.97 12.02"
        stroke={color}
        strokeWidth="7"
        fill="none"
      />
      {/* Inner band */}
      <path
        d="M28.21 18.41 A 7 7 0 1 1 19.79 18.41"
        stroke={color}
        strokeWidth="3.5"
        fill="none"
      />
    </svg>
  );
}
