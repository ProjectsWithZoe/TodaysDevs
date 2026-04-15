import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate, useSearchParams, Link }        from 'react-router-dom'
import api                                           from '../api/client.js'
import { useTitleEffect }                            from '../hooks/useTitleEffect.js'
import { QueueStatus }                               from '../components/QueueStatus.jsx'
import { CancelMatchmaking }                         from '../components/CancelMatchmaking.jsx'

const POLL_INTERVAL = 3000

export default function MatchmakingWait() {
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const projectId          = searchParams.get('project')
  const mode               = searchParams.get('mode')
  const [status,     setStatus]     = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [error,      setError]      = useState(null)
  const cancelledRef = useRef(false)
  useTitleEffect('Finding a Match')

  const pollStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/matchmaking/status')
      if (data.status === 'matched') {
        navigate(`/rooms/${data.room_id}/workspace`, { replace: true })
        return
      }
      if (data.status === 'not_queued' && !cancelledRef.current) {
        navigate(`/projects/${projectId}/mode`, { replace: true })
        return
      }
      setStatus(data.status)
      setStatusData(data)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Connection error — retrying…')
    }
  }, [navigate, projectId])

  useEffect(() => { pollStatus() }, [pollStatus])
  useEffect(() => {
    const timer = setInterval(pollStatus, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [pollStatus])

  function handleCancelled() {
    cancelledRef.current = true
    navigate(`/projects/${projectId}/mode`, { replace: true })
  }

  if (!projectId || !mode) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">Invalid matchmaking URL.</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <nav className="detail-nav">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <span>Finding a {mode === 'duo' ? 'partner' : 'team'}</span>
      </nav>

      <div className="card p-10 flex flex-col items-center gap-6 max-w-sm mx-auto">
        {error && <p className="field-error text-sm w-full text-center" role="alert">{error}</p>}

        {status === 'queued' && statusData ? (
          <QueueStatus
            position={statusData.position}
            total={statusData.total}
            mode={statusData.mode}
            queuedAt={statusData.queued_at}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm text-slate-500">Connecting…</p>
          </div>
        )}

        <CancelMatchmaking onCancelled={handleCancelled} />
      </div>
    </div>
  )
}
