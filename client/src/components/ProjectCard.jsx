import { Link } from 'react-router-dom'

const DIFFICULTY_LABELS = { junior: 'Junior', mid: 'Mid', senior: 'Senior' }
const TYPE_LABELS        = { solo: 'Solo', duo: 'Duo', team: 'Team' }

// Role colour mapping for the composition bar
const ROLE_COLORS = {
  frontend:  'bg-violet-500',
  backend:   'bg-sky-500',
  fullstack: 'bg-emerald-500',
}

function RoleBar({ frontend_count, backend_count, fullstack_count }) {
  const total = (frontend_count ?? 0) + (backend_count ?? 0) + (fullstack_count ?? 0)
  if (total === 0) return null

  const segments = [
    { key: 'frontend',  count: frontend_count  ?? 0, color: ROLE_COLORS.frontend,  label: 'FE' },
    { key: 'backend',   count: backend_count   ?? 0, color: ROLE_COLORS.backend,   label: 'BE' },
    { key: 'fullstack', count: fullstack_count ?? 0, color: ROLE_COLORS.fullstack, label: 'FS' },
  ].filter(s => s.count > 0)

  return (
    <div className="space-y-1">
      {/* Stacked bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {segments.map(s => (
          <div
            key={s.key}
            className={`${s.color} transition-all`}
            style={{ flex: s.count }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2.5">
        {segments.map(s => (
          <span key={s.key} className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.color}`} />
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ProjectCard({
  id, title, description, difficulty, type, responsibilities_count,
  active_count, lobby_count,
  frontend_count, backend_count, fullstack_count,
}) {
  const isMultiplayer = type === 'duo' || type === 'team'
  const hasActivity   = (active_count ?? 0) > 0 || (lobby_count ?? 0) > 0

  return (
    <Link
      to={`/projects/${id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`badge badge-${difficulty}`}>
          {DIFFICULTY_LABELS[difficulty]}
        </span>
        <span className="badge badge-type">{TYPE_LABELS[type]}</span>

        {/* Activity badges */}
        {hasActivity && (
          <span className="flex items-center gap-1 ml-auto">
            {(active_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {active_count} active
              </span>
            )}
            {isMultiplayer && (lobby_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                ⏳ {lobby_count} waiting
              </span>
            )}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Role composition bar — multiplayer only */}
      {isMultiplayer && (active_count ?? 0) > 0 && (
        <RoleBar
          frontend_count={frontend_count}
          backend_count={backend_count}
          fullstack_count={fullstack_count}
        />
      )}

      {responsibilities_count > 0 && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {responsibilities_count} task{responsibilities_count !== 1 ? 's' : ''} for your role
        </p>
      )}
    </Link>
  )
}
