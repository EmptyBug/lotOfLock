export default function NumberLockThumbnail() {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 고리 */}
      <path
        d="M 35 52 A 15 20 0 0 1 65 52"
        fill="none"
        stroke="#5c6bc0"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* 몸통 */}
      <rect x="12" y="50" width="76" height="68" rx="10" ry="10" fill="#3949ab" />
      <rect x="15" y="53" width="70" height="62" rx="8" ry="8" fill="#5c6bc0" />
      {/* 다이얼 3개 */}
      {[26, 50, 74].map((cx) => (
        <g key={cx}>
          <rect x={cx - 11} y="66" width="22" height="30" rx="4" fill="#283593" />
          <rect x={cx - 9} y="68" width="18" height="26" rx="3" fill="#1a237e" />
          <text
            x={cx}
            y="86"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#e8eaf6"
            fontFamily="monospace"
          >
            0
          </text>
        </g>
      ))}
    </svg>
  )
}
