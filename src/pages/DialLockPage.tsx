import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const N = 40

function randomCombo(len: number): number[] {
  return Array.from({ length: len }, () => Math.floor(Math.random() * N))
}

function angleToNum(angle: number): number {
  return (N - Math.round(((angle % 360) + 360) % 360 / 360 * N) )% N
}

export default function DialLockPage() {
  const navigate = useNavigate()
  const [len, setLen] = useState(3)
  const [combo, setCombo] = useState<number[]>(() => randomCombo(3))
  const [dialAngle, setDialAngle] = useState(0)
  const [inputs, setInputs] = useState<number[]>([])
  const [status, setStatus] = useState<'idle' | 'success' | 'fail'>('idle')

  const dragging = useRef(false)
  const prevAngle = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)

  function getAngle(clientX: number, clientY: number): number {
    const rect = svgRef.current!.getBoundingClientRect()
    const x = clientX - (rect.left + rect.width / 2)
    const y = clientY - (rect.top + rect.height / 2)
    return Math.atan2(x, -y) * (180 / Math.PI)
  }

  function startDrag(clientX: number, clientY: number) {
    dragging.current = true
    prevAngle.current = getAngle(clientX, clientY)
  }

  function applyDrag(clientX: number, clientY: number) {
    if (!dragging.current) return
    const cur = getAngle(clientX, clientY)
    let delta = cur - prevAngle.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    setDialAngle(a => a + delta)
    prevAngle.current = cur
  }

  function stopDrag() {
    dragging.current = false
  }

  function handleConfirm() {
    if (status !== 'idle') return
    const num = angleToNum(dialAngle)
    const next = [...inputs, num]
    if (next.length < combo.length) {
      setInputs(next)
    } else {
      const ok = combo.every((n, i) => n === next[i])
      setInputs(next)
      setStatus(ok ? 'success' : 'fail')
      if (!ok) setTimeout(() => { setInputs([]); setStatus('idle') }, 1500)
    }
  }

  function reset() {
    setCombo(randomCombo(len))
    setDialAngle(0)
    setInputs([])
    setStatus('idle')
  }

  function changeLen(n: number) {
    setLen(n)
    setCombo(randomCombo(n))
    setDialAngle(0)
    setInputs([])
    setStatus('idle')
  }

  const currentNum = angleToNum(dialAngle)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-xs flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← 뒤로
        </button>
        <h1 className="flex-1 text-center font-bold">다이얼 자물쇠</h1>
      </div>

      {/* Dial SVG */}
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        width="280"
        height="280"
        className="cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onMouseMove={e => applyDrag(e.clientX, e.clientY)}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => { e.preventDefault(); applyDrag(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchEnd={stopDrag}
      >
        {/* Outer bezel */}
        <circle cx="150" cy="150" r="148" fill="#111827" stroke="#374151" strokeWidth="2" />

        {/* Red indicator at top */}
        <polygon points="150,4 143,19 157,19" fill="#ef4444" />

        {/* Rotating dial */}
        <g transform={`rotate(${dialAngle}, 150, 150)`}>
          <circle cx="150" cy="150" r="130" fill="#1e3a5f" />
          <circle cx="150" cy="150" r="125" fill="#1e2d5a" />

          {Array.from({ length: N }).map((_, i) => {
            const θ = (i / N) * 2 * Math.PI
            const isMajor = i % 5 === 0
            const x1 = 150 + 125 * Math.sin(θ)
            const y1 = 150 - 125 * Math.cos(θ)
            const x2 = 150 + (isMajor ? 111 : 118) * Math.sin(θ)
            const y2 = 150 - (isMajor ? 111 : 118) * Math.cos(θ)
            const nx = 150 + 99 * Math.sin(θ)
            const ny = 150 - 99 * Math.cos(θ)
            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#93c5fd"
                  strokeWidth={isMajor ? 2 : 1}
                  opacity={isMajor ? 1 : 0.4}
                />
                {isMajor && (
                  <text
                    x={nx} y={ny}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#dbeafe"
                    transform={`rotate(${(i / N) * 360}, ${nx}, ${ny})`}
                  >
                    {i}
                  </text>
                )}
              </g>
            )
          })}

          {/* Center knob */}
          <circle cx="150" cy="150" r="38" fill="#162040" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="150" cy="150" r="28" fill="#1d4ed8" />
          <circle cx="150" cy="150" r="9" fill="#1e40af" />
        </g>

        {/* Success overlay */}
        {status === 'success' && (
          <>
            <circle cx="150" cy="150" r="148" fill="rgba(74,222,128,0.12)" />
            <text
              x="150" y="158"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="64"
              fill="#4ade80"
            >
              ✓
            </text>
          </>
        )}
      </svg>

      {/* Current number */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-1">현재 위치</p>
        <span className="text-5xl font-mono font-bold text-blue-300">
          {String(currentNum).padStart(2, '0')}
        </span>
      </div>

      {/* Input slots — wraps full width, no scroll */}
      <div className="mt-5 w-full px-2 flex flex-wrap gap-2 justify-center">
        {Array.from({ length: combo.length }).map((_, i) => {
          const filled = i < inputs.length
          const active = i === inputs.length && status === 'idle'
          return (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-mono font-bold border-2 transition-all duration-200
                ${filled && status === 'success'
                  ? 'bg-green-900/50 border-green-500 text-green-300'
                  : filled && status === 'fail'
                  ? 'bg-red-900/50 border-red-500 text-red-300'
                  : filled
                  ? 'bg-blue-900/50 border-blue-500 text-blue-200'
                  : active
                  ? 'border-blue-400 bg-gray-800/50 ring-2 ring-blue-400/30 text-gray-600'
                  : 'border-gray-700 bg-gray-900/50 text-gray-700'}`}
            >
              {filled ? String(inputs[i]).padStart(2, '0') : '—'}
            </div>
          )
        })}
      </div>

      {/* Confirm / status */}
      <div className="mt-4 h-12 flex items-center">
        {status === 'idle' && (
          <button
            onClick={handleConfirm}
            className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl font-bold transition-colors"
          >
            확인
          </button>
        )}
        {status === 'success' && (
          <p className="text-green-400 text-xl font-bold">열렸습니다!</p>
        )}
        {status === 'fail' && (
          <p className="text-red-400 font-semibold">틀렸습니다...</p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="mt-8 w-full max-w-xs space-y-4">
        {/* Password length */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm shrink-0">비밀번호 길이</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeLen(Math.max(2, len - 1))}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg leading-none transition-colors"
            >−</button>
            <span className="w-8 text-center font-bold tabular-nums">{len}</span>
            <button
              onClick={() => changeLen(Math.min(30, len + 1))}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg leading-none transition-colors"
            >+</button>
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            리셋
          </button>
        </div>
      </div>
    </div>
  )
}
