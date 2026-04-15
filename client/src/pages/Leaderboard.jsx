import { useState, useEffect, useCallback } from 'react'
import api                                  from '../api/client.js'
import { useTitleEffect }                   from '../hooks/useTitleEffect.js'
import { LeaderboardTable }                 from '../components/LeaderboardTable.jsx'
import { SkeletonRow }                      from '../components/PageSkeleton.jsx'
import { formatScore }                      from '../lib/utils.js'
import { StreakFlame }                      from '../components/StreakFlame.jsx'

const TABS  = ['global', 'solo', 'duo', 'team']
const ROLES = [
  { value: '',          label: 'All roles'  },
  { value: 'frontend',  label: 'Frontend'   },
  { value: 'backend',   label: 'Backend'    },
  { value: 'fullstack', label: 'Full Stack' },
]

export default function Leaderboard() {
  const [tab,     setTab]     = useState('global')
  const [role,    setRole]    = useState('')
  const [entries, setEntries] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useTitleEffect('Leaderboard')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ type: tab, limit: 50, offset: 0 })
      if (role) params.set('role', role)
      const { data } = await api.get(`/leaderboard?${params}`)
      setEntries(data.data)
      setTotal(data.total)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [tab, role])

  useEffect(() => {
    api.get('/leaderboard/me').then(({ data }) => setMyStats(data)).catch(() => {})
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">Leaderboard</h2>

      {/* My rank banner */}
      {myStats?.rank && (
        <div className="card px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: `#${myStats.rank}`,                     label: 'Your rank'  },
            { value: formatScore(myStats.score),             label: 'Score'      },
            { value: myStats.projects_completed ?? 0,        label: 'Projects'   },
            { value: <StreakFlame streakDays={myStats.streak_days ?? 0} size={16} />, label: 'Streak' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-lg font-bold text-slate-800">{value}</span>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5" role="tablist">
          {TABS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                tab === t
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              ].join(' ')}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <select
          className="field-input py-1.5 text-xs w-full sm:w-36"
          value={role}
          onChange={e => setRole(e.target.value)}
          aria-label="Filter by role"
        >
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="field-error text-sm" role="alert">{error}</p>}

      {loading ? (
        <div className="card overflow-hidden divide-y divide-slate-100">
          {Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <LeaderboardTable entries={entries} myStats={myStats} />
      )}

      {!loading && total > entries.length && (
        <p className="text-xs text-slate-400 text-center">
          Showing {entries.length} of {total} players
        </p>
      )}
    </div>
  )
}
