import { Avatar }      from './Avatar.jsx'
import { RoleBadge }   from './RoleBadge.jsx'
import { StreakFlame } from './StreakFlame.jsx'
import { formatScore } from '../lib/utils.js'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardRow({ entry, isSelf }) {
  const medal = MEDALS[entry.rank]

  return (
    <tr
      className={[
        'border-b border-slate-100 transition-colors',
        isSelf ? 'bg-brand-50' : 'hover:bg-slate-50'
      ].join(' ')}
      aria-current={isSelf ? 'true' : undefined}
    >
      {/* Rank */}
      <td className="px-4 py-3 w-14 text-center">
        {medal ? (
          <span className="text-lg" aria-label={`Rank ${entry.rank}`}>{medal}</span>
        ) : (
          <span className="text-sm font-semibold text-slate-500">{entry.rank}</span>
        )}
      </td>

      {/* Player */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={entry.display_name} size="sm" />
          <span className={[
            'text-sm font-medium truncate',
            isSelf ? 'text-brand-700' : 'text-slate-800'
          ].join(' ')}>
            {entry.display_name}
            {isSelf && <span className="ml-1.5 text-xs text-brand-500 font-normal">(you)</span>}
          </span>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3 hidden sm:table-cell">
        {entry.role && <RoleBadge role={entry.role} />}
      </td>

      {/* Score */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold text-slate-800">{formatScore(entry.score)}</span>
      </td>

      {/* Projects */}
      <td className="px-4 py-3 text-right hidden md:table-cell">
        <span className="text-sm text-slate-600">{entry.projects_completed ?? 0}</span>
      </td>

      {/* Streak */}
      <td className="px-4 py-3 text-right hidden md:table-cell">
        <StreakFlame streakDays={entry.streak_days ?? 0} />
      </td>
    </tr>
  )
}
