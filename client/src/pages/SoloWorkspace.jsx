import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate }              from 'react-router-dom'
import api                                           from '../api/client.js'
import { useTitleEffect }                            from '../hooks/useTitleEffect.js'
import { RoleRequirements }                          from '../components/RoleRequirements.jsx'
import { SubmissionStatus }                          from '../components/SubmissionStatus.jsx'
import { SubmissionLock }                            from '../components/SubmissionLock.jsx'

const POLL_INTERVAL = 5000  // ms

function RequirementSection({ title, items }) {
  if (!items || !items.length) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <ol className="space-y-2 list-decimal list-inside marker:text-slate-400">
        {items.map(r => (
          <li key={r.id} className="text-sm text-slate-600 leading-relaxed pl-1">{r.body}</li>
        ))}
      </ol>
    </section>
  )
}

/** Modal shown when the duo partner leaves — lets remaining user decide */
function PartnerLeftModal({ roomId, onResolved }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function decide(decision) {
    setBusy(true)
    try {
      await api.patch(`/rooms/${roomId}/partner-decision`, { decision })
      navigate('/projects')
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800">Your partner left</h2>
          <p className="text-sm text-slate-500">
            Would you like to find a new partner, or leave the project?
          </p>
        </div>

        <div className="space-y-2">
          <button
            className="btn-primary w-full justify-center"
            disabled={busy}
            onClick={() => decide('requeue')}
          >
            Find a new partner
          </button>
          <button
            className="btn-secondary w-full justify-center"
            disabled={busy}
            onClick={() => decide('dissolve')}
          >
            Leave project
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SoloWorkspace() {
  const { id } = useParams()
  const [room,         setRoom]         = useState(null)
  const [project,      setProject]      = useState(null)
  const [submission,   setSubmission]   = useState(null)
  const [isLocked,     setIsLocked]     = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [showModal,    setShowModal]    = useState(false)
  const pollRef = useRef(null)
  useTitleEffect(project ? `${project.title} — Workspace` : 'Workspace')

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data: roomData } = await api.get(`/rooms/${id}`)
        const [projectRes, submissionRes] = await Promise.allSettled([
          api.get(`/projects/${roomData.project_id}`),
          api.get(`/submissions/${id}`, { _silent: true })
        ])
        setRoom(roomData)
        if (projectRes.status === 'fulfilled') {
          setProject(projectRes.value.data)
        } else {
          throw new Error('Failed to load project')
        }
        if (submissionRes.status === 'fulfilled') {
          setSubmission(submissionRes.value.data)
          setIsLocked(true)
        }
        // Show modal immediately if room already in partner_left state
        if (roomData.mode === 'duo' && roomData.status === 'partner_left') {
          setShowModal(true)
        }
      } catch (err) {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Poll room status for duo partner_left ────────────────────────────────────
  const pollRoom = useCallback(async () => {
    if (!room || room.mode !== 'duo') return
    try {
      const { data } = await api.get(`/rooms/${id}`, { _silent: true })
      setRoom(data)
      if (data.status === 'partner_left') setShowModal(true)
    } catch {
      // silent — don't disrupt workspace on poll error
    }
  }, [id, room])

  useEffect(() => {
    if (!room || room.mode !== 'duo' || showModal) return
    pollRef.current = setInterval(pollRoom, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [room, showModal, pollRoom])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading workspace…</div>
  )
  if (error) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  const functional    = project.requirements.filter(r => r.type === 'functional')
  const nonFunctional = project.requirements.filter(r => r.type === 'non-functional')

  return (
    <div className="space-y-5">
      {showModal && <PartnerLeftModal roomId={id} />}
      {isLocked && <SubmissionLock />}

      {/* Header */}
      <div>
        <nav className="detail-nav">
          <Link to="/projects">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${room.project_id}`}>{project.title}</Link>
          <span>/</span>
          <span>Workspace</span>
        </nav>
        <h2 className="text-2xl font-bold text-slate-800 mt-2">{project.title}</h2>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className={`badge badge-${project.difficulty}`}>{project.difficulty}</span>
          <span className="badge badge-type">Solo</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main — brief + requirements */}
        <div className="flex-1 space-y-5">
          {project.description && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Brief</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
            </div>
          )}

          <div className="card p-5 space-y-6">
            <RequirementSection title="Functional requirements"     items={functional} />
            <RequirementSection title="Non-functional requirements" items={nonFunctional} />
          </div>

          {project.responsibilities?.length > 0 && (
            <div className="card p-5">
              <RoleRequirements responsibilities={project.responsibilities} />
            </div>
          )}
        </div>

        {/* Aside */}
        <aside className="lg:w-60 shrink-0 space-y-4">
          {/* Tasks placeholder */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Your tasks</h3>
            <p className="text-xs text-slate-400">Task tracking coming soon.</p>
          </div>

          {/* Submit CTA / status */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Submit project</h3>
            {submission ? (
              <SubmissionStatus submission={submission} />
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Submit your repository link for review when you're ready.
                </p>
                <Link
                  to={`/rooms/${id}/submit`}
                  className={[
                    'btn-primary w-full justify-center',
                    room?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
                  ].join(' ')}
                  aria-disabled={room?.status !== 'active'}
                >
                  Submit for review
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
