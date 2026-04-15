import { useEffect, useRef, useState } from 'react'

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function QueueStatus({ position, total, mode, queuedAt }) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const start = queuedAt ? new Date(queuedAt).getTime() : Date.now()
    function tick() { setElapsed(Math.floor((Date.now() - start) / 1000)) }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => clearInterval(intervalRef.current)
  }, [queuedAt])

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Animated spinner */}
      <div className="relative w-14 h-14">
        <svg className="absolute inset-0 animate-spin" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="24" stroke="#e2e8f0" strokeWidth="4" />
          <path
            d="M28 4a24 24 0 0 1 24 24"
            stroke="#6366f1"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-600">
          {formatElapsed(elapsed)}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">
          Searching for a {mode === 'duo' ? 'partner' : 'team'}…
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Position <strong className="text-slate-700">{position}</strong> of{' '}
          <strong className="text-slate-700">{total}</strong> in queue
        </p>
      </div>

      <p className="text-xs text-slate-400 max-w-xs">
        Constraints relax after 1 minute to help you match faster.
      </p>
    </div>
  )
}
