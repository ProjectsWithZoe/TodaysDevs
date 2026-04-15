/** Deterministic background from name charCodes */
const PALETTE = [
  'bg-indigo-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
]

function bgFromName(name) {
  if (!name) return PALETTE[0]
  const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PALETTE[code % PALETTE.length]
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-11 h-11 text-base',
}

/**
 * Props: { name: string, size?: 'sm'|'md'|'lg' }
 */
export function Avatar({ name, size = 'md' }) {
  const bg    = bgFromName(name)
  const sizes = SIZE_CLASSES[size] ?? SIZE_CLASSES.md

  return (
    <span
      className={`${bg} ${sizes} inline-flex items-center justify-center rounded-full text-white font-bold shrink-0 select-none`}
      aria-label={name ?? 'User avatar'}
    >
      {initials(name)}
    </span>
  )
}
