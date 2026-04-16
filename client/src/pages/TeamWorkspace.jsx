import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link }                           from 'react-router-dom'
import api                                           from '../api/client.js'
import { useTitleEffect }                            from '../hooks/useTitleEffect.js'
import { RoleRequirements }                          from '../components/RoleRequirements.jsx'
import { SubmissionStatus }                          from '../components/SubmissionStatus.jsx'
import { SubmissionLock }                            from '../components/SubmissionLock.jsx'
import { MemberList }                                from '../components/MemberList.jsx'

const POLL_INTERVAL = 5000  // ms

const ROLE_LABELS = { frontend: 'Frontend', backend: 'Backend', fullstack: 'Full Stack' }

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

/** Banner shown while the team is looking for a replacement member */
function SeekingReplacementBanner({ seekingRole }) {
  const label = seekingRole ? (ROLE_LABELS[seekingRole] ?? seekingRole) : 'a developer'
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
      <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-sm">
        <span className="font-semibold">Team member left.</span>{' '}
        Looking for {label} to fill the spot — you can keep building while we search.
      </p>
    </div>
  )
}

export default function TeamWorkspace() {
  const { id } = useParams()
  const [room,       setRoom]       = useState(null)
  const [project,    setProject]    = useState(null)
  const [submission, setSubmission] = useState(null)
  const [isLocked,   setIsLocked]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
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
      } catch (err) {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Poll room status to detect seeking_replacement / replacement arrival ─────
  const pollRoom = useCallback(async () => {
    try {
      const { data } = await api.get(`/rooms/${id}`, { _silent: true })
      setRoom(data)
    } catch {
      // silent — don't disrupt workspace on poll error
    }
  }, [id])

  useEffect(() => {
    if (!room) return
    pollRef.current = setInterval(pollRoom, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [room, pollRoom])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading workspace…</div>
  )
  if (error) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  const functional    = (project.requirements ?? []).filter(r => r.type === 'functional')
  const nonFunctional = (project.requirements ?? []).filter(r => r.type === 'non-functional')
  const isSeeking     = room?.status === 'seeking_replacement'

  return (
    <div className="space-y-5">
      {isLocked && <SubmissionLock />}

      {/* Seeking-replacement banner */}
      {isSeeking && (
        <SeekingReplacementBanner seekingRole={room.seeking_role} />
      )}

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
          <span className="badge badge-type capitalize">{room.mode}</span>
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
          {/* Team members */}
          {room.members?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Team</h3>
              <MemberList members={room.members} mode={room.mode} />
            </div>
          )}

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
