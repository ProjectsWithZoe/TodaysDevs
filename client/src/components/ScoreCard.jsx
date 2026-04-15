import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import api                     from '../api/client.js'
import { StreakFlame }         from './StreakFlame.jsx'
import { formatScore }         from '../lib/utils.js'

function Skeleton() {
  return (
    <div className="card p-5" aria-busy="true" aria-label="Loading score">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-7 w-14 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compact stats widget.
 * Props:
 *   stats — pre-fetched leaderboard/me data (from Dashboard).
 *           If omitted the component fetches its own data.
 */
export function ScoreCard({ stats: statsProp }) {
  const [stats,   setStats]   = useState(statsProp ?? null)
  const [loading, setLoading] = useState(!statsProp)

  useEffect(() => {
    if (statsProp !== undefined) {
      setStats(statsProp)
      setLoading(false)
      return
    }
    api.get('/leaderboard/me', { _silent: true })
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [statsProp])

  if (loading) return <Skeleton />

  if (!stats || stats.score === 0) {
    return (
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          No score yet — submit a project to appear on the leaderboard!
        </p>
        <Link to="/leaderboard" className="btn-ghost btn-sm shrink-0">
          View leaderboard
        </Link>
      </div>
    )
  }

  const metrics = [
    { value: stats.rank ? `#${stats.rank}` : '—', label: 'Global rank' },
    { value: formatScore(stats.score),              label: 'Total score' },
    { value: stats.projects_completed ?? 0,         label: 'Projects' },
    { value: <StreakFlame streakDays={stats.streak_days ?? 0} size={18} />, label: 'Streak' },
  ]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Your stats</h3>
        <Link to="/leaderboard" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
          Full leaderboard →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xl font-bold text-slate-800">{value}</span>
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
