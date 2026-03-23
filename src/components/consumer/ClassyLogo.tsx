export function ClassyLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="11" stroke="#2a2a2a" strokeWidth="1.2" />
      {/* C-shape path (open circle letter) */}
      <path
        d="M16.5 7.5A7 7 0 1 0 16.5 16.5"
        stroke="#2a2a2a"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Gold drop at open end of C */}
      <circle cx="16.5" cy="16.5" r="1.3" fill="#b8975a" />
    </svg>
  );
}
