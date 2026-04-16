import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate }   from 'react-router-dom'
import toast                 from 'react-hot-toast'
import { useAuth }           from '../hooks/useAuth.js'
import { useApiCall }        from '../hooks/useApiCall.js'
import { useTitleEffect }    from '../hooks/useTitleEffect.js'
import { useAppStore }       from '../store/useAppStore.js'
import api                   from '../api/client.js'
import { SubmissionStatus }  from '../components/SubmissionStatus.jsx'
import { ScoreCard }         from '../components/ScoreCard.jsx'
import { SkeletonCard }      from '../components/PageSkeleton.jsx'

const ROLE_SUBTITLE = {
  frontend:  'Build great UIs',
  backend:   'Design robust APIs',
  fullstack: 'Own the full feature',
}

function RemoveProjectModal({ roomTitle, busy, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="card w-full max-w-sm p-6 space-y-5"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-project-modal-title"
      >
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-9.75 0V6a1.5 1.5 0 011.5-1.5h4.5A1.5 1.5 0 0115.75 6v1.5m-8.25 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M10 11.25v4.5m4-4.5v4.5" />
            </svg>
          </div>
          <div>
            <h3 id="remove-project-modal-title" className="text-base font-bold text-slate-800">
              Remove project?
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {roomTitle} will be removed from your dashboard and you will leave this active room.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="btn-danger flex-1 justify-center"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Removing…' : 'Remove'}
          </button>
          <button
            type="button"
            className="btn-ghost flex-1 justify-center"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const { setActiveRoom, clearActiveRoom } = useAppStore()
  useTitleEffect('Dashboard')
  const [roomList, setRoomList] = useState([])
  const [removingRoomId, setRemovingRoomId] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)

  // Wait until auth is resolved before deciding whether to redirect
  if (!isLoading && user && !user.role) {
    return <Navigate to="/role-select" replace />
  }

  const { data: rooms,   loading: loadingRooms } = useApiCall(
    () => api.get('/rooms/my', { _silent: true }),
    []
  )
  const { data: myStats, loading: loadingStats } = useApiCall(
    () => api.get('/leaderboard/me', { _silent: true }),
    []
  )

  useEffect(() => {
    setRoomList(rooms ?? [])
  }, [rooms])

  const activeRooms    = useMemo(() => roomList.filter(r => r.status === 'active'), [roomList])
  const completedRooms = useMemo(() => roomList.filter(r => r.status === 'completed').slice(0, 3), [roomList])

  // Use the first active room's id as the dep — avoids firing on every render
  const firstActiveRoomId = activeRooms[0]?.id ?? null
  useEffect(() => {
    if (!firstActiveRoomId) return
    const r = activeRooms[0]
    setActiveRoom({ id: r.id, mode: r.mode, projectTitle: r.project?.title ?? 'Project' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstActiveRoomId])

  const displayName = user?.display_name || user?.email || 'there'
  const firstName   = displayName.split('@')[0]
  const subtitle    = ROLE_SUBTITLE[user?.role?.toLowerCase()] ?? 'Keep building'

  async function confirmRemoveProject() {
    if (!pendingRemoval) return

    setRemovingRoomId(pendingRemoval.id)
    try {
      await api.post(`/rooms/${pendingRemoval.id}/leave`, { requeue: false })
      setRoomList(current => current.filter(item => item.id !== pendingRemoval.id))

      if (firstActiveRoomId === pendingRemoval.id) {
        clearActiveRoom()
      }

      setPendingRemoval(null)
      toast.success('Project removed from your dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to remove project')
    } finally {
      setRemovingRoomId(null)
    }
  }

  return (
    <div className="space-y-6">
      {pendingRemoval && (
        <RemoveProjectModal
          roomTitle={pendingRemoval.project_title ?? 'This project'}
          busy={removingRoomId === pendingRemoval.id}
          onConfirm={confirmRemoveProject}
          onCancel={() => setPendingRemoval(null)}
        />
      )}

      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Welcome back, {firstName}!
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Score widget */}
      {loadingStats ? <SkeletonCard lines={2} /> : <ScoreCard stats={myStats} />}

      {/* Quick start — only if no active room */}
      {!loadingRooms && activeRooms.length === 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Start a project</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/projects" className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse projects
            </Link>
          </div>
        </div>
      )}

      {/* Active projects */}
      {!loadingRooms && activeRooms.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Active projects</h3>
          <ul className="space-y-3">
            {activeRooms.map(room => (
              <li key={room.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {room.project_title ?? 'Untitled'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className={`badge badge-status-${room.status}`}>{room.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="btn-ghost btn-sm text-slate-500 hover:text-rose-600"
                    onClick={() => setPendingRemoval(room)}
                    disabled={removingRoomId === room.id}
                  >
                    {removingRoomId === room.id ? 'Removing…' : 'Remove'}
                  </button>
                  <Link
                    to={`/rooms/${room.id}/workspace`}
                    className="btn-primary btn-sm"
                  >
                    Continue
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent completions */}
      {!loadingRooms && completedRooms.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent completions</h3>
          <ul className="space-y-2">
            {completedRooms.map(room => (
              <li key={room.id} className="card p-4 flex items-center gap-4 opacity-90">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {room.project?.title ?? 'Untitled'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="badge badge-status-completed">completed</span>
                  </div>
                  {room._submission && (
                    <div className="mt-1.5">
                      <SubmissionStatus submission={room._submission} />
                    </div>
                  )}
                </div>
                <Link
                  to={`/rooms/${room.id}/workspace`}
                  className="btn-ghost btn-sm shrink-0"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
