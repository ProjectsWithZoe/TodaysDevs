const ROLE_CLASSES = {
  frontend:  'bg-violet-100 text-violet-700',
  backend:   'bg-teal-100 text-teal-700',
  fullstack: 'bg-rose-100 text-rose-700',
}

const NULL_CLASSES = 'bg-slate-100 text-slate-500'

/**
 * Props: { role: string | null }
 */
export function RoleBadge({ role }) {
  const lower   = role?.toLowerCase()
  const classes = ROLE_CLASSES[lower] ?? NULL_CLASSES
  const label   = lower
    ? lower === 'fullstack' ? 'Full Stack' : lower.charAt(0).toUpperCase() + lower.slice(1)
    : 'No role'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${classes}`}>
      {label}
    </span>
  )
}
