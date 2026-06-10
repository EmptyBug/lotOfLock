export default function PadlockThumbnail() {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 고리 */}
      <path
        d="M 33 55 L 33 38 A 17 17 0 0 1 67 38 L 67 55"
        fill="none"
        stroke="#f9a825"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* 몸통 */}
      <rect x="18" y="52" width="64" height="62" rx="10" ry="10" fill="#fbc02d" />
      <rect x="22" y="56" width="56" height="54" rx="8" ry="8" fill="#fdd835" />
      {/* 열쇠구멍 */}
      <circle cx="50" cy="78" r="9" fill="#f57f17" />
      <rect x="46" y="84" width="8" height="14" rx="2" fill="#f57f17" />
    </svg>
  )
}
