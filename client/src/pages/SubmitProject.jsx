import { useState, useEffect }  from 'react'
import { useParams, Link }       from 'react-router-dom'
import api                       from '../api/client.js'
import { useTitleEffect }        from '../hooks/useTitleEffect.js'
import { Avatar }                from '../components/Avatar.jsx'
import { RoleBadge }             from '../components/RoleBadge.jsx'
import { SubmitForm }            from '../components/SubmitForm.jsx'

export default function SubmitProject() {
  const { id: roomId } = useParams()
  const [room,    setRoom]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useTitleEffect('Submit Project')

  useEffect(() => {
    api.get(`/rooms/${roomId}`)
      .then(({ data }) => setRoom(data))
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load room'))
      .finally(() => setLoading(false))
  }, [roomId])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
  )
  if (error) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl">
      {/* Breadcrumb */}
      <nav className="detail-nav">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <Link to={`/rooms/${roomId}/workspace`}>{room.project?.title ?? 'Workspace'}</Link>
        <span>/</span>
        <span>Submit</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Submit your project</h2>
        <p className="text-sm text-slate-500 mt-1">
          Paste your repository URL for review.
        </p>
      </div>

      {/* Project context */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`badge badge-${room.project?.difficulty}`}>{room.project?.difficulty}</span>
          <span className="badge badge-type">{room.mode}</span>
        </div>
        <p className="text-sm font-semibold text-slate-800">{room.project?.title}</p>

        {room.members?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Team</p>
            <ul className="space-y-2">
              {room.members.map(m => (
                <li key={m.user_id} className="flex items-center gap-2.5">
                  <Avatar name={m.display_name} size="sm" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{m.display_name}</span>
                  {m.role && <RoleBadge role={m.role} />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Submission form */}
      <div className="card p-5">
        <SubmitForm teamId={roomId} roomId={roomId} />
      </div>
    </div>
  )
}
