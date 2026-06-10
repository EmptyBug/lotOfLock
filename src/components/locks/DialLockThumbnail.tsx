export default function DialLockThumbnail() {
  return (
    <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 고리 */}
      <path
        d="M 35 52 A 15 20 0 0 1 65 52"
        fill="none"
        stroke="#7a8a9a"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* 몸통 */}
      <rect x="18" y="50" width="64" height="68" rx="10" ry="10" fill="#b0bec5" />
      <rect x="21" y="53" width="58" height="62" rx="8" ry="8" fill="#cfd8dc" />
      {/* 다이얼 베이스 */}
      <circle cx="50" cy="83" r="22" fill="#90a4ae" />
      <circle cx="50" cy="83" r="19" fill="#b0bec5" />
      {/* 눈금선 */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2
        const inner = i % 5 === 0 ? 14 : 16
        const x1 = 50 + Math.cos(angle) * inner
        const y1 = 83 + Math.sin(angle) * inner
        const x2 = 50 + Math.cos(angle) * 19
        const y2 = 83 + Math.sin(angle) * 19
        return (
          <line
            key={i}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke="#78909c"
            strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
          />
        )
      })}
      {/* 다이얼 중앙 */}
      <circle cx="50" cy="83" r="6" fill="#78909c" />
      <circle cx="50" cy="83" r="3" fill="#546e7a" />
      {/* 마커 (상단 화살표) */}
      <polygon points="50,61 47,67 53,67" fill="#ef5350" />
    </svg>
  )
}
