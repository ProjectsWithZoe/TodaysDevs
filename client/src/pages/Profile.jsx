import { useState, useRef }    from 'react'
import { Link }                from 'react-router-dom'
import api                     from '../api/client.js'
import { useAuth }             from '../hooks/useAuth.js'
import { useApiCall }          from '../hooks/useApiCall.js'
import { useTitleEffect }      from '../hooks/useTitleEffect.js'
import { Avatar }              from '../components/Avatar.jsx'
import { RoleBadge }           from '../components/RoleBadge.jsx'
import { SubmissionStatus }    from '../components/SubmissionStatus.jsx'
import { StreakFlame }         from '../components/StreakFlame.jsx'
import { SkeletonCard }        from '../components/PageSkeleton.jsx'
import { formatScore, formatDate } from '../lib/utils.js'

const ROLES = [
  { value: 'frontend',  label: 'Frontend',   desc: 'React, Vue, CSS, accessibility' },
  { value: 'backend',   label: 'Backend',    desc: 'APIs, databases, server logic'   },
  { value: 'fullstack', label: 'Full Stack', desc: 'End-to-end feature ownership'    },
]

export default function Profile() {
  const { user, updateUser } = useAuth()
  useTitleEffect('Profile')

  const { data: stats, loading: loadingStats } = useApiCall(
    () => api.get('/leaderboard/me', { _silent: true }), []
  )
  const { data: rooms, loading: loadingRooms } = useApiCall(
    () => api.get('/rooms/my', { _silent: true }), []
  )

  // ── Display name inline edit ────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false)
  const [nameValue,   setNameValue]   = useState('')
  const [nameSaving,  setNameSaving]  = useState(false)
  const nameInputRef = useRef(null)

  function startEditName() {
    setNameValue(user?.display_name ?? '')
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  async function saveName() {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === user?.display_name) { setEditingName(false); return }
    if (trimmed.length < 2 || trimmed.length > 50) return
    setNameSaving(true)
    try {
      const { data } = await api.patch('/users/me', { display_name: trimmed })
      updateUser({ display_name: data.display_name })
      setEditingName(false)
    } catch { /* toast shown by interceptor */ }
    finally { setNameSaving(false) }
  }

  // ── Role change ─────────────────────────────────────────────────────────────
  const [changingRole, setChangingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [roleSaving,   setRoleSaving]   = useState(false)

  async function saveRole() {
    if (!selectedRole || selectedRole === user?.role) { setChangingRole(false); return }
    setRoleSaving(true)
    try {
      await api.patch('/users/me/role', { role: selectedRole })
      updateUser({ role: selectedRole })
      setChangingRole(false)
    } catch { /* toast shown by interceptor */ }
    finally { setRoleSaving(false) }
  }

  const displayName    = user?.display_name || user?.email || ''
  const completedRooms = (rooms ?? []).filter(r => r.status === 'completed')

  return (
    <div className="space-y-6">

      {/* ── Identity card ── */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar name={displayName} size="lg" />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Editable name */}
          {editingName ? (
            <input
              ref={nameInputRef}
              className="field-input text-base font-semibold py-1 max-w-xs"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              maxLength={50}
              disabled={nameSaving}
              aria-label="Display name"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 truncate">{displayName}</h2>
              <button
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={startEditName}
                aria-label="Edit display name"
                title="Edit name"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-sm text-slate-500">{user?.email}</p>
          <RoleBadge role={user?.role ?? null} />
        </div>

        <button
          className="btn-ghost btn-sm shrink-0"
          onClick={() => { setSelectedRole(user?.role ?? null); setChangingRole(true) }}
        >
          Change role
        </button>
      </div>

      {/* ── Role picker modal ── */}
      {changingRole && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setChangingRole(false)}
        >
          <div
            className="card w-full max-w-sm p-6 space-y-5"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
          >
            <div>
              <h3 id="role-modal-title" className="text-base font-bold text-slate-800">Change your role</h3>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                This affects future matchmaking pairings.
              </p>
            </div>

            <div className="space-y-2" role="radiogroup">
              {ROLES.map(r => (
                <label
                  key={r.value}
                  className={[
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    selectedRole === r.value
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={selectedRole === r.value}
                    onChange={() => setSelectedRole(r.value)}
                    className="sr-only"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${selectedRole === r.value ? 'text-brand-700' : 'text-slate-800'}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                  </div>
                  {selectedRole === r.value && (
                    <svg className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button className="btn-primary flex-1 justify-center" onClick={saveRole} disabled={roleSaving}>
                {roleSaving ? 'Saving…' : 'Save role'}
              </button>
              <button className="btn-ghost flex-1 justify-center" onClick={() => setChangingRole(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {loadingStats ? <SkeletonCard lines={3} /> : stats && (
        <div className="card p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-700">Your stats</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: stats.rank ? `#${stats.rank}` : '—', label: 'Global rank'  },
              { value: formatScore(stats.score),             label: 'Total score'  },
              { value: stats.projects_completed ?? 0,        label: 'Completed'    },
              { value: <StreakFlame streakDays={stats.streak_days ?? 0} size={18} />, label: 'Streak' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xl font-bold text-slate-800">{value}</span>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Score breakdown bars */}
          <div className="space-y-2.5">
            {[
              { label: 'Solo',  value: stats.solo_score  },
              { label: 'Duo',   value: stats.duo_score   },
              { label: 'Team',  value: stats.team_score  },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: stats.score ? `${Math.round((value / stats.score) * 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 w-14 text-right shrink-0">
                  {formatScore(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Submission history ── */}
      {loadingRooms ? <SkeletonCard lines={4} /> : completedRooms.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Submission history</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {completedRooms.map(room => (
              <li key={room.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {room.project?.title ?? 'Untitled'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`badge badge-${room.project?.difficulty}`}>
                      {room.project?.difficulty}
                    </span>
                    <span className="badge badge-type">{room.mode}</span>
                    <span className="text-xs text-slate-400">{formatDate(room.created_at)}</span>
                  </div>
                </div>
                <Link to={`/rooms/${room.id}/workspace`} className="btn-ghost btn-sm shrink-0">
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
