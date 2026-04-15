import { formatDate } from '../lib/utils.js'

const STATUS_BADGE = {
  pending:  'badge-amber',
  reviewed: 'badge-blue',
  accepted: 'badge-green',
  rejected: 'badge-red',
}

/**
 * Displays submission details with a coloured status badge.
 * Props: { submission }
 */
export function SubmissionStatus({ submission }) {
  if (!submission) return null

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${STATUS_BADGE[submission.status] ?? 'badge-gray'} capitalize`}>
          {submission.status}
        </span>
        <span className="text-xs text-slate-500">
          by <strong className="text-slate-700">{submission.submitted_by_name ?? 'a teammate'}</strong>
          {' · '}
          {formatDate(submission.submitted_at)}
        </span>
      </div>

      <a
        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline truncate max-w-xs"
        href={submission.repo_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {submission.repo_url}
      </a>

      {submission.notes && (
        <p className="text-xs text-slate-500 italic">{submission.notes}</p>
      )}
    </div>
  )
}
