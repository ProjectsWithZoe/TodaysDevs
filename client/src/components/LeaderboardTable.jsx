import { useAuth }          from '../hooks/useAuth.js'
import { LeaderboardRow }   from './LeaderboardRow.jsx'
import { formatScore }      from '../lib/utils.js'

export function LeaderboardTable({ entries, myStats }) {
  const { user } = useAuth()

  if (entries.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-slate-500">
        No scores yet — complete a project to appear here.
      </div>
    )
  }

  const selfInPage = entries.some(e => e.user_id === user?.id)

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-14">#</th>
              <th className="px-4 py-2.5 text-left   text-xs font-semibold text-slate-500 uppercase tracking-wide">Player</th>
              <th className="px-4 py-2.5 text-left   text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Role</th>
              <th className="px-4 py-2.5 text-right  text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
              <th className="px-4 py-2.5 text-right  text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Projects</th>
              <th className="px-4 py-2.5 text-right  text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                isSelf={entry.user_id === user?.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky "your rank" — shown when self is off-screen */}
      {!selfInPage && myStats?.rank && (
        <div className="border-t border-brand-200 bg-brand-50 px-4 py-2.5 flex items-center gap-4 text-sm">
          <span className="font-bold text-brand-700">#{myStats.rank}</span>
          <span className="text-brand-600 flex-1">Your rank</span>
          <span className="font-semibold text-brand-700">{formatScore(myStats.score)} pts</span>
        </div>
      )}
    </div>
  )
}
