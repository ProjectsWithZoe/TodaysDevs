import { useState, useEffect }           from 'react'
import { useParams, useNavigate, Link }  from 'react-router-dom'
import api                               from '../api/client.js'
import { useTitleEffect }                from '../hooks/useTitleEffect.js'
import { ModeCard }                      from '../components/ModeCard.jsx'

const MODES = ['solo', 'duo', 'team']

export default function ModeSelect() {
  const { id: projectId } = useParams()
  const navigate          = useNavigate()
  const [project,  setProject]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState(null)
  useTitleEffect('Choose Mode')

  useEffect(() => {
    api.get(`/projects/${projectId}`)
      .then(({ data }) => setProject(data))
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false))
  }, [projectId])

  async function createRoom(mode) {
    setBusy(true)
    setError(null)
    try {
      const { data: room } = await api.post('/rooms', { project_id: projectId, mode })
      navigate(mode === 'solo' ? `/rooms/${room.id}/workspace` : `/rooms/${room.id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create room')
      setBusy(false)
    }
  }

  async function findPartner(mode) {
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post('/matchmaking/queue', { project_id: projectId, mode })
      if (data.status === 'matched') {
        navigate(`/rooms/${data.room_id}/workspace`, { replace: true })
      } else {
        navigate(`/matchmaking/wait?project=${projectId}&mode=${mode}`, { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to join queue')
      setBusy(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
  )

  if (error && !project) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <nav className="detail-nav">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}`}>{project?.title}</Link>
        <span>/</span>
        <span>Choose mode</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold text-slate-800">How do you want to work?</h2>
        <p className="text-sm text-slate-500 mt-1">
          This is a <strong className="text-slate-700">{project?.type}</strong> project — only the matching mode is available.
        </p>
      </div>

      {error && <p className="field-error text-sm" role="alert">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MODES.map(mode => {
          const isProjectMode = project?.type === mode
          return (
            <ModeCard
              key={mode}
              mode={mode}
              disabled={!isProjectMode}
              disabledReason={
                !isProjectMode
                  ? `This project is designed for ${project?.type} mode`
                  : undefined
              }
            >
              {mode === 'solo' && (
                <button className="btn-primary" onClick={() => createRoom('solo')} disabled={busy}>
                  {busy ? 'Starting…' : 'Start solo'}
                </button>
              )}
              {(mode === 'duo' || mode === 'team') && (
                <button className="btn-primary" onClick={() => findPartner(mode)} disabled={busy}>
                  {mode === 'duo' ? 'Find a partner' : 'Find teammates'}
                </button>
              )}
            </ModeCard>
          )
        })}
      </div>
    </div>
  )
}
