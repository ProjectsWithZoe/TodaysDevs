import { Link } from 'react-router-dom'

const DIFFICULTY_LABELS = { junior: 'Junior', mid: 'Mid', senior: 'Senior' }

export function ProjectCard({
  id, title, description, difficulty, responsibilities_count,
  active_count,
}) {
  const peopleCount = active_count ?? 0

  return (
    <Link
      to={`/projects/${id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`badge badge-${difficulty}`}>
          {DIFFICULTY_LABELS[difficulty]}
        </span>

        {peopleCount > 0 && (
          <span className="flex items-center gap-1 ml-auto">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {peopleCount} working on this
            </span>
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
