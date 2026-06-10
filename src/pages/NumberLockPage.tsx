import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DIGIT_H        = 30
const VH             = 350
const BODY_Y         = 108
const BODY_H         = 212
const DIAL_CY        = BODY_Y + 90   // 198
const WIN_H          = DIGIT_H * 3   // 90
const DEFAULT_COUNT  = 3

// ── layout ────────────────────────────────────────────────────────────────────
// Fixed dial size; maintains the same body-edge → dial-edge gap as the 3-dial default.
function dialLayout(count: number) {
  const W        = 52   // dial window width (fixed)
  const GAP      = 6    // gap between dial windows (fixed)
  const SIDE_PAD = 36   // body-edge → first/last dial-edge (matches 3-dial layout)
  const BODY_PAD = 20   // SVG viewport edge → body edge

  // First dial centre = viewport_left + body_pad + side_pad + half_dial = 82
  const first = BODY_PAD + SIDE_PAD + W / 2
  const step  = W + GAP
  const last  = first + (count - 1) * step
  const vw    = last + W / 2 + SIDE_PAD + BODY_PAD

  return {
    w: W,
    vw,
    centers: Array.from({ length: count }, (_, i) => first + i * step),
  }
}

function rndCombo(count: number) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10))
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NumberLockPage() {
  const navigate = useNavigate()

  const [digitCount, setDigitCount] = useState(DEFAULT_COUNT)
  const [combo,      setCombo]      = useState(() => rndCombo(DEFAULT_COUNT))
  const [offsets,    setOffsets]    = useState(() => Array(DEFAULT_COUNT).fill(0) as number[])
  const [status,     setStatus]     = useState<'idle' | 'success' | 'fail'>('idle')
  const [flash,      setFlash]      = useState(false)

  const svgRef  = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ col: number; lastY: number } | null>(null)
  const offRef  = useRef<number[]>(Array(DEFAULT_COUNT).fill(0))
  const rafRef  = useRef<(number | null)[]>(Array(DEFAULT_COUNT).fill(null))

  useEffect(() => () => {
    rafRef.current.forEach(r => r !== null && cancelAnimationFrame(r))
  }, [])

  // ── snap animation ───────────────────────────────────────────────────────────

  function snapCol(col: number) {
    const from = offRef.current[col]
    const to   = Math.round(from)
    if (Math.abs(to - from) < 0.01) { offRef.current[col] = to; return }
    const t0 = performance.now(), dur = 160
    function step(now: number) {
      const t = Math.min((now - t0) / dur, 1)
      const v = from + (to - from) * (1 - Math.pow(1 - t, 3))
      offRef.current[col] = v
      setOffsets(p => { const n = [...p]; n[col] = v; return n })
      if (t < 1) rafRef.current[col] = requestAnimationFrame(step)
      else        rafRef.current[col] = null
    }
    rafRef.current[col] = requestAnimationFrame(step)
  }

  // ── drag handlers ─────────────────────────────────────────────────────────────

  function toSvgY(clientY: number) {
    const r = svgRef.current!.getBoundingClientRect()
    return (clientY - r.top) / r.height * VH
  }

  function onDown(cx: number, cy: number) {
    if (status !== 'idle') return
    const { w, centers } = dialLayout(digitCount)
    const r  = svgRef.current!.getBoundingClientRect()
    // Use the current layout's vw to map clientX to svg coords
    const { vw } = dialLayout(digitCount)
    const sx  = (cx - r.left) / r.width * vw
    const col = centers.findIndex(c => Math.abs(sx - c) < w / 2 + 6)
    if (col === -1) return
    const existing = rafRef.current[col]
    if (existing !== null) { cancelAnimationFrame(existing); rafRef.current[col] = null }
    dragRef.current = { col, lastY: toSvgY(cy) }
  }

  function onMove(cy: number) {
    if (!dragRef.current) return
    const { col } = dragRef.current
    const y     = toSvgY(cy)
    const delta = (dragRef.current.lastY - y) / DIGIT_H
    offRef.current[col] += delta
    dragRef.current.lastY = y
    setOffsets(p => { const n = [...p]; n[col] = offRef.current[col]; return n })
  }

  function onUp() {
    if (!dragRef.current) return
    const { col } = dragRef.current
    dragRef.current = null
    snapCol(col)
  }

  // ── lock interaction ──────────────────────────────────────────────────────────

  function confirm() {
    if (status !== 'idle') return
    const ok = combo.every(
      (n, i) => n === (((Math.round(offRef.current[i]) % 10) + 10) % 10)
    )
    if (ok) { setStatus('success'); return }
    setFlash(true); setStatus('fail')
    setTimeout(() => { setFlash(false); setStatus('idle') }, 1000)
  }

  function reset() {
    rafRef.current.forEach((r, i) => {
      if (r !== null) { cancelAnimationFrame(r); rafRef.current[i] = null }
    })
    offRef.current = Array(digitCount).fill(0)
    setOffsets(Array(digitCount).fill(0))
    setCombo(rndCombo(digitCount))
    setStatus('idle')
    setFlash(false)
  }

  function changeDigitCount(n: number) {
    if (n === digitCount) return
    rafRef.current.forEach((r, i) => {
      if (r !== null) { cancelAnimationFrame(r); rafRef.current[i] = null }
    })
    dragRef.current = null
    offRef.current  = Array(n).fill(0)
    rafRef.current  = Array(n).fill(null)
    setDigitCount(n)
    setOffsets(Array(n).fill(0))
    setCombo(rndCombo(n))
    setStatus('idle')
    setFlash(false)
  }

  // ── render ────────────────────────────────────────────────────────────────────

  const { w: dW, vw, centers } = dialLayout(digitCount)
  const cx    = vw / 2
  const bodyX = 20
  const bodyW = vw - 40
  const open  = status === 'success'
  const inner = flash ? '#450a0a' : open ? '#14532d' : '#1e3a8a'
  const shack = open ? '#4ade80' : '#64748b'
  // shackle arch: fixed width 112 px, centred on cx
  const sl = cx - 56, sr = cx + 56

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-xs flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >← 뒤로</button>
        <h1 className="flex-1 text-center font-bold">번호 자물쇠</h1>
      </div>

      {/* SVG scales down to fit screen — no scroll */}
      <div className="w-full flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${vw} ${VH}`}
          className="select-none block mx-auto"
          style={{ width: '100%', maxWidth: vw, height: 'auto', cursor: 'ns-resize', touchAction: 'none' }}
          onMouseDown={e => onDown(e.clientX, e.clientY)}
          onMouseMove={e => onMove(e.clientY)}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={e => onDown(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientY) }}
          onTouchEnd={onUp}
        >
          <defs>
            <linearGradient id="dfade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0d1117" stopOpacity="1" />
              <stop offset="28%"  stopColor="#0d1117" stopOpacity="0" />
              <stop offset="72%"  stopColor="#0d1117" stopOpacity="0" />
              <stop offset="100%" stopColor="#0d1117" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Shackle */}
          <g style={{ transform: `translateY(${open ? -28 : 0}px)`, transition: 'transform .5s ease-in-out' }}>
            <path
              d={`M ${sl} ${BODY_Y} L ${sl} 56 Q ${sl} 16 ${cx} 16 Q ${sr} 16 ${sr} 56 L ${sr} ${BODY_Y}`}
              fill="none" stroke={shack} strokeWidth="16" strokeLinecap="round"
            />
          </g>

          {/* Body */}
          <rect x={bodyX} y={BODY_Y} width={bodyW} height={BODY_H} rx="14" fill="#0f172a" />
          <rect
            x={bodyX + 6} y={BODY_Y + 6}
            width={bodyW - 12} height={BODY_H - 12}
            rx="10" fill={inner}
            style={{ transition: 'fill .12s' }}
          />
          <rect x={bodyX + 16} y={BODY_Y + 16} width={bodyW - 32} height={4} rx="2" fill="rgba(0,0,0,0.25)" />

          {/* Dial windows */}
          {centers.map((dcx, col) => {
            const wx  = dcx - dW / 2
            const wy  = DIAL_CY - WIN_H / 2
            const off = offsets[col] ?? 0
            const ci  = Math.round(off)

            return (
              <g key={col}>
                <rect x={wx} y={wy} width={dW} height={WIN_H} rx="6" fill="#0d1117" />

                {/* nested SVG as clip viewport */}
                <svg x={wx} y={wy} width={dW} height={WIN_H} overflow="hidden">
                  <g transform={`translate(${dW / 2},${WIN_H / 2})`}>
                    {Array.from({ length: 6 }, (_, k) => {
                      const idx   = ci - 2 + k
                      const num   = ((idx % 10) + 10) % 10
                      const dy    = (idx - off) * DIGIT_H
                      const isCur = idx === ci
                      return (
                        <text
                          key={idx}
                          x="0" y={dy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={isCur ? Math.min(26, dW - 4) : Math.min(16, dW - 8)}
                          fontWeight={isCur ? 'bold' : 'normal'}
                          fill={isCur ? '#f8fafc' : '#374151'}
                          fontFamily="monospace"
                        >
                          {num}
                        </text>
                      )
                    })}
                  </g>
                </svg>

                {/* selection lines */}
                <line x1={wx} y1={DIAL_CY - DIGIT_H / 2} x2={wx + dW} y2={DIAL_CY - DIGIT_H / 2}
                  stroke="#4b5563" strokeWidth="1" />
                <line x1={wx} y1={DIAL_CY + DIGIT_H / 2} x2={wx + dW} y2={DIAL_CY + DIGIT_H / 2}
                  stroke="#4b5563" strokeWidth="1" />

                {/* fade overlay */}
                <rect x={wx} y={wy} width={dW} height={WIN_H}
                  fill="url(#dfade)" style={{ pointerEvents: 'none' }} />

                {/* border */}
                <rect x={wx} y={wy} width={dW} height={WIN_H} rx="6"
                  fill="none" stroke="#475569" strokeWidth="1.5" />
              </g>
            )
          })}

          {/* Brand strip */}
          <text
            x={cx} y={DIAL_CY + WIN_H / 2 + 22}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9" letterSpacing="3" fill="rgba(255,255,255,0.15)"
            fontFamily="monospace"
          >COMBINATION LOCK</text>

          {open && (
            <text x={cx} y={BODY_Y + BODY_H - 32}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="18" fontWeight="bold" fill="#4ade80"
            >열렸습니다!</text>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div className="mt-2 w-full max-w-xs flex flex-col items-center gap-3">
        <div className="h-6 flex items-center">
          {status === 'fail' && <p className="text-red-400 text-sm font-semibold">틀렸습니다...</p>}
        </div>

        {status === 'idle' && (
          <button
            onClick={confirm}
            className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl font-bold transition-colors"
          >확인</button>
        )}

        <div className="flex items-center w-full">
          <button
            onClick={reset}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >리셋</button>
        </div>

        {/* Digit count selector */}
        <div className="flex items-center gap-3 w-full mt-1">
          <span className="text-gray-400 text-sm shrink-0">번호 갯수</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDigitCount(Math.max(1, digitCount - 1))}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg leading-none transition-colors"
            >−</button>
            <span className="w-8 text-center font-bold tabular-nums">{digitCount}</span>
            <button
              onClick={() => changeDigitCount(Math.min(30, digitCount + 1))}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg leading-none transition-colors"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  )
}
