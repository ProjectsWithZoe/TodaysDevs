import { CAPACITY, MIN_TO_START } from '../lib/constants.js'

const MODE_META = {
  solo:  {
    label: 'Solo',
    description: 'Work through the project entirely on your own at your own pace.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )
  },
  duo:   {
    label: 'Duo',
    description: 'Pair with one other developer — split the work by frontend and backend.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    )
  },
  team:  {
    label: 'Team',
    description: 'Collaborate with up to 6 people and simulate a real-world team workflow.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    )
  },
}

export function ModeCard({ mode, disabled, disabledReason, children }) {
  const { label, description, icon } = MODE_META[mode]
  const min = MIN_TO_START[mode]
  const max = CAPACITY[mode]
  const playerRange = min === max ? `${min} player` : `${min}–${max} players`

  return (
    <div
      className={[
        'card p-5 flex flex-col gap-3',
        disabled ? 'opacity-50 pointer-events-none' : ''
      ].join(' ')}
      aria-label={disabled ? `${label} — ${disabledReason}` : label}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-brand-600">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{playerRange}</p>
        </div>
      </div>

      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>

      {disabled && disabledReason && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          {disabledReason}
        </p>
      )}

      {!disabled && (
        <div className="flex flex-col gap-2 mt-1">
          {children}
        </div>
      )}
    </div>
  )
}
