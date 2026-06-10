import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const RING_R  = 88
const KEY_LEN = 54
const CX = 150, CY = 150

const DEFAULT_KEY_COUNT = 10

// ── helpers ───────────────────────────────────────────────────────────────────

function getSelected(ringAngle: number, count: number): number {
  const step = 360 / count
  let best = 0, bestDiff = Infinity
  for (let i = 0; i < count; i++) {
    const a    = ((i * step + ringAngle) % 360 + 360) % 360
    const diff = Math.min(Math.abs(a - 270), 360 - Math.abs(a - 270))
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
}

function snap(angle: number, count: number): number {
  const step = 360 / count
  const mod  = ((angle - 270) % step + step) % step
  return mod <= step / 2 ? angle - mod : angle + (step - mod)
}

function newGame(count: number) {
  return { correctId: Math.floor(Math.random() * count) }
}

// ── Padlock ───────────────────────────────────────────────────────────────────

function PadlockSVG({ open, flash, keyTurnAngle, showKey }: {
  open: boolean; flash: boolean; keyTurnAngle: number; showKey: boolean
}) {
  const body    = open ? '#16a34a' : flash ? '#7f1d1d' : '#1e3a5f'
  const shackle = open ? '#4ade80' : flash ? '#f87171' : '#64748b'
  const hole    = open ? '#4ade80' : '#0f172a'
  return (
    <svg viewBox="0 0 130 185" width="118" height="168" overflow="visible">
      <g style={{ transform: `translateY(${open ? -30 : 0}px)`, transition: 'transform .5s ease-in-out' }}>
        <path d="M 36 82 L 36 46 Q 36 16 65 16 Q 94 16 94 46 L 94 82"
          fill="none" stroke={shackle} strokeWidth="12" strokeLinecap="round" />
      </g>
      <rect x="12" y="74" width="106" height="100" rx="14" fill="#0f172a" />
      <rect x="16" y="78" width="98"  height="92"  rx="11" fill={body} />
      <circle cx="65" cy="118" r="12" fill={hole} />
      <polygon points="58,128 65,145 72,128" fill={hole} />
      {showKey && (
        <g transform="translate(65,118)">
          <g style={{ transform: `rotate(${keyTurnAngle}deg)`, transition: 'transform .5s ease-in-out', transformOrigin: '0 0' }}>
            <circle cx="0" cy="-23" r="10"  fill="none" stroke="#fbbf24" strokeWidth="3.5" />
            <circle cx="0" cy="-23" r="4"   fill="#fbbf24" />
            <rect   x="-2.5" y="-13" width="5" height="32" rx="1.5" fill="#fbbf24" />
            <rect   x=" 2.5" y=" -5" width="6" height="5"  rx=".5"  fill="#fbbf24" />
            <rect   x=" 2.5" y="  5" width="6" height="5"  rx=".5"  fill="#fbbf24" />
            <rect   x=" 2.5" y=" 14" width="4" height="4"  rx=".5"  fill="#fbbf24" />
          </g>
        </g>
      )}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PadlockPage() {
  const navigate = useNavigate()

  const [keyCount,     setKeyCount]     = useState(DEFAULT_KEY_COUNT)
  const [game,         setGame]         = useState(() => newGame(DEFAULT_KEY_COUNT))
  const [ringAngle,    setRingAngle]    = useState(270)
  const [triedIds,     setTriedIds]     = useState<Set<number>>(new Set())
  const [status,       setStatus]       = useState<'idle' | 'turning' | 'success' | 'fail'>('idle')
  const [keyTurnAngle, setKeyTurnAngle] = useState(0)
  const [flash,        setFlash]        = useState(false)
  const [swayAngles,   setSwayAngles]   = useState<number[]>(() => Array(DEFAULT_KEY_COUNT).fill(0))

  const dragging    = useRef(false)
  const prevMouse   = useRef(0)
  const angleRef    = useRef(270)
  const keyCountRef = useRef(DEFAULT_KEY_COUNT)
  const snapRaf     = useRef<number | null>(null)
  const physicsRaf  = useRef<number | null>(null)
  const svgRef      = useRef<SVGSVGElement>(null)
  const sway = useRef({
    angles:     Array(DEFAULT_KEY_COUNT).fill(0) as number[],
    velocities: Array(DEFAULT_KEY_COUNT).fill(0) as number[],
  })

  useEffect(() => () => {
    if (snapRaf.current    !== null) cancelAnimationFrame(snapRaf.current)
    if (physicsRaf.current !== null) cancelAnimationFrame(physicsRaf.current)
  }, [])

  const selectedId = getSelected(ringAngle, keyCount)
  const allTried   = triedIds.size >= keyCount

  // ── physics loop ────────────────────────────────────────────────────────────

  function startPhysics() {
    if (physicsRaf.current !== null) return
    function step() {
      const { angles, velocities } = sway.current
      const cnt = angles.length
      const sel = getSelected(angleRef.current, keyCountRef.current)
      let live  = false
      for (let i = 0; i < cnt; i++) {
        if (i === sel) {
          angles[i]     *= 0.55
          velocities[i] *= 0.55
        } else {
          velocities[i] *= 0.87
          angles[i]     += velocities[i]
          angles[i]     *= 0.94
          if (angles[i] >  12) { angles[i] =  12; velocities[i] *= -0.25 }
          if (angles[i] < -12) { angles[i] = -12; velocities[i] *= -0.25 }
        }
        if (Math.abs(velocities[i]) > 0.02 || Math.abs(angles[i]) > 0.05) live = true
      }
      setSwayAngles([...angles])
      if (live) {
        physicsRaf.current = requestAnimationFrame(step)
      } else {
        angles.fill(0); velocities.fill(0)
        setSwayAngles(Array(cnt).fill(0))
        physicsRaf.current = null
      }
    }
    physicsRaf.current = requestAnimationFrame(step)
  }

  function addImpulse(delta: number) {
    const { velocities } = sway.current
    const sel = getSelected(angleRef.current, keyCountRef.current)
    for (let i = 0; i < velocities.length; i++) {
      if (i === sel) continue
      velocities[i] += -delta * (0.04 + Math.random() * 0.1)
      velocities[i] += (Math.random() - 0.5) * Math.abs(delta) * 0.06
    }
    startPhysics()
  }

  // ── ring drag ───────────────────────────────────────────────────────────────

  function mouseAngleFn(clientX: number, clientY: number): number {
    const r = svgRef.current!.getBoundingClientRect()
    const x = (clientX - r.left) / r.width  * 300 - CX
    const y = (clientY - r.top)  / r.height * 300 - CY
    return Math.atan2(x, -y) * (180 / Math.PI)
  }

  function startDrag(cx: number, cy: number) {
    if (status !== 'idle') return
    if (snapRaf.current !== null) cancelAnimationFrame(snapRaf.current)
    dragging.current  = true
    prevMouse.current = mouseAngleFn(cx, cy)
  }

  function moveDrag(cx: number, cy: number) {
    if (!dragging.current) return
    const cur = mouseAngleFn(cx, cy)
    let delta = cur - prevMouse.current
    if (delta >  180) delta -= 360
    if (delta < -180) delta += 360
    angleRef.current += delta
    setRingAngle(angleRef.current)
    prevMouse.current = cur
    if (Math.abs(delta) > 0.04) addImpulse(delta)
  }

  function endDrag() {
    if (!dragging.current) return
    dragging.current = false
    const from = angleRef.current
    const to   = snap(from, keyCountRef.current)
    if (Math.abs(to - from) < 0.3) { angleRef.current = to; setRingAngle(to); return }
    const t0  = performance.now(), dur = 220
    function step(now: number) {
      const t = Math.min((now - t0) / dur, 1)
      const e = 1 - Math.pow(1 - t, 3)
      const v = from + (to - from) * e
      angleRef.current = v
      setRingAngle(v)
      if (t < 1) snapRaf.current = requestAnimationFrame(step)
    }
    snapRaf.current = requestAnimationFrame(step)
  }

  // ── lock interaction ────────────────────────────────────────────────────────

  function handleTurn() {
    if (status !== 'idle') return
    setStatus('turning')
    setKeyTurnAngle(90)
    setTimeout(() => {
      if (selectedId === game.correctId) {
        setStatus('success')
      } else {
        setFlash(true)
        setTriedIds(prev => new Set(prev).add(selectedId))
        setTimeout(() => { setKeyTurnAngle(0); setFlash(false); setStatus('idle') }, 950)
      }
    }, 550)
  }

  function handleReset() {
    if (snapRaf.current    !== null) cancelAnimationFrame(snapRaf.current)
    if (physicsRaf.current !== null) cancelAnimationFrame(physicsRaf.current)
    snapRaf.current = null; physicsRaf.current = null
    sway.current.angles.fill(0); sway.current.velocities.fill(0)
    setGame(newGame(keyCount))
    angleRef.current = 270
    setRingAngle(270)
    setTriedIds(new Set())
    setStatus('idle')
    setKeyTurnAngle(0)
    setFlash(false)
    setSwayAngles(Array(keyCount).fill(0))
  }

  function changeKeyCount(n: number) {
    if (n === keyCount) return
    if (snapRaf.current    !== null) cancelAnimationFrame(snapRaf.current)
    if (physicsRaf.current !== null) cancelAnimationFrame(physicsRaf.current)
    snapRaf.current = null; physicsRaf.current = null
    sway.current.angles     = Array(n).fill(0)
    sway.current.velocities = Array(n).fill(0)
    keyCountRef.current = n
    setKeyCount(n)
    setGame(newGame(n))
    angleRef.current = 270
    setRingAngle(270)
    setTriedIds(new Set())
    setStatus('idle')
    setKeyTurnAngle(0)
    setFlash(false)
    setSwayAngles(Array(n).fill(0))
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const step = 360 / keyCount
  // scale bow radius so adjacent keys never overlap; clamp 3–10
  const bow     = Math.max(3, Math.min(10, Math.floor(RING_R * Math.sin(Math.PI / keyCount) * 0.85)))
  const bladeW  = Math.max(2, Math.round(bow * 0.6))
  const keyLen  = Math.max(20, Math.round(KEY_LEN * bow / 10))
  const holeR   = Math.max(1, Math.round(bow * 0.4))
  const showDetail = bow >= 5

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl flex items-center mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← 뒤로
        </button>
        <h1 className="flex-1 text-center font-bold">열쇠 자물쇠</h1>
      </div>

      <div className="flex items-center gap-8">
        {/* ── Padlock ── */}
        <div className="flex flex-col items-center gap-4">
          <PadlockSVG open={status === 'success'} flash={flash} keyTurnAngle={keyTurnAngle} showKey={status !== 'idle'} />
          <div className="flex gap-3">
            <button
              onClick={handleTurn}
              disabled={status !== 'idle' || allTried}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40
                         disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-colors"
            >
              돌리기
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              리셋
            </button>
          </div>
          <div className="h-6 flex items-center">
            {status === 'success' && <p className="text-green-400 font-bold">열렸습니다!</p>}
            {flash                 && <p className="text-red-400   text-sm">맞지 않습니다</p>}
            {!flash && status === 'idle' && allTried &&
              <p className="text-gray-500 text-sm">모든 열쇠를 시도했습니다</p>}
          </div>
        </div>

        {/* ── Key ring ── */}
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          width="300" height="300"
          className="cursor-grab active:cursor-grabbing select-none"
          onMouseDown={e  => startDrag(e.clientX, e.clientY)}
          onMouseMove={e  => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e  => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={endDrag}
        >
          {/* Dark backdrop */}
          <circle cx={CX} cy={CY} r={RING_R + 12} fill="#0a0a0f" />
          {/* Ring interior fill */}
          <circle cx={CX} cy={CY} r={RING_R - 5} fill="#111827" />

          {/* Ring face */}
          <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="#6b7280" strokeWidth="10" />
          <circle cx={CX} cy={CY} r={RING_R + 5} fill="none" stroke="#e5e7eb" strokeWidth="1" opacity=".18" />
          <circle cx={CX} cy={CY} r={RING_R - 5} fill="none" stroke="#000" strokeWidth="3" opacity=".55" />

          {/* Keys — rendered after ring */}
          {Array.from({ length: keyCount }, (_, i) => {
            const totalDeg = ((i * step + ringAngle) % 360 + 360) % 360
            const totalRad = totalDeg * Math.PI / 180
            const bx       = CX + RING_R * Math.sin(totalRad)
            const by       = CY - RING_R * Math.cos(totalRad)
            const isSel    = i === selectedId
            const isTried  = triedIds.has(i)

            const keyRot = isSel ? 90 : swayAngles[i] ?? 0
            const color  = isTried ? '#374151' : isSel ? '#fde68a' : '#b45309'
            const op     = isTried ? 0.3 : 1

            return (
              <g key={i} transform={`translate(${bx},${by}) rotate(${keyRot})`} opacity={op}>
                {isSel && (
                  <circle cx="0" cy="0" r={bow + 5}
                    fill="none" stroke="#fbbf24" strokeWidth="2" opacity=".85" />
                )}
                <g transform="translate(1,2)" opacity="0.35">
                  <rect x={-bladeW/2} y="2" width={bladeW} height={keyLen} rx="1.5" fill="#000" />
                  <circle cx="0" cy="0" r={bow} fill="#000" />
                </g>
                <rect x={-bladeW/2} y="2" width={bladeW} height={keyLen} rx="1.5" fill={color} />
                {!isTried && showDetail && (
                  <>
                    <rect x={bladeW/2}  y="10" width={Math.round(bow*0.9)} height={Math.round(bow*0.6)} rx="1" fill={color} />
                    <rect x={bladeW/2}  y={10+Math.round(bow*1.2)} width={Math.round(bow*0.9)} height={Math.round(bow*0.6)} rx="1" fill={color} />
                    <rect x={bladeW/2}  y={10+Math.round(bow*2.4)} width={Math.round(bow*0.7)} height={Math.round(bow*0.5)} rx="1" fill={color} />
                  </>
                )}
                <circle cx="0" cy="0" r={bow} fill={color} stroke="#78350f" strokeWidth="1.5" />
                <circle cx="0" cy="0" r={holeR} fill="#111827" />
                {bow >= 6 && <circle cx={-bow*0.25} cy={-bow*0.3} r={bow*0.25} fill="rgba(255,255,255,0.12)" />}
              </g>
            )
          })}

          {/* 9 o'clock indicator */}
          <polygon points="10,150 22,143 22,157" fill="#ef4444" />
        </svg>
      </div>

      {/* Key count selector */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-gray-400 text-sm shrink-0">열쇠 갯수</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeKeyCount(Math.max(3, keyCount - 1))}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg leading-none transition-colors"
          >−</button>
          <span className="w-8 text-center font-bold tabular-nums">{keyCount}</span>
          <button
            onClick={() => changeKeyCount(Math.min(30, keyCount + 1))}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg leading-none transition-colors"
          >+</button>
        </div>
      </div>
    </div>
  )
}
