/**
 * Flame icon with colour keyed to streak intensity.
 *   0–2   → gray (outline)
 *   3–6   → amber
 *   7–14  → coral/orange
 *   15+   → red
 */
function flameColor(streakDays) {
  if (streakDays >= 15) return '#ef4444'
  if (streakDays >= 7)  return '#f97316'
  if (streakDays >= 3)  return '#f59e0b'
  return null
}

export function StreakFlame({ streakDays = 0, size = 16 }) {
  const fill   = flameColor(streakDays)
  const color  = fill ?? '#9ca3af'
  const filled = !!fill

  return (
    <span
      className="inline-flex items-center gap-1"
      title={`${streakDays}-day streak`}
      aria-label={`${streakDays}-day streak`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1
             6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1
             3.361-6.387Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 17.25a3.75 3.75 0 0 1-3.215-5.67l.003-.005c.22-.38
             .487-.737.784-1.063L12 7.5l2.428 2.012c.297.327.563.683
             .784 1.063l.003.005A3.75 3.75 0 0 1 12 17.25Z"
        />
      </svg>
      <span style={{ fontSize: size * 0.85, color, fontWeight: 700 }}>
        {streakDays}
      </span>
    </span>
  )
}
