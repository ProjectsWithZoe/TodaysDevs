import { useState, useEffect }           from 'react'
import { useParams, useNavigate, Link }  from 'react-router-dom'
import ReactMarkdown                     from 'react-markdown'
import api                               from '../api/client.js'
import { useTitleEffect }                from '../hooks/useTitleEffect.js'
import { RoleRequirements }              from '../components/RoleRequirements.jsx'

const DIFFICULTY_LABELS = { junior: 'Junior', mid: 'Mid', senior: 'Senior' }

const ROLE_LABELS = { frontend: 'Frontend', backend: 'Backend', fullstack: 'Fullstack' }

function RequirementsList({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <ol className="space-y-2 list-decimal list-inside marker:text-slate-400">
        {items.map(r => (
          <li key={r.id} className="text-sm text-slate-600 leading-relaxed pl-1">
            {r.body}
          </li>
        ))}
      </ol>
    </section>
  )
}

function ProjectSteps({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Step-by-step guide</h3>
      <ol className="space-y-4">
        {steps.map(s => (
          <li key={s.id} className="flex gap-4">
            {/* Step number bubble */}
            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mt-0.5">
              {s.step}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">{s.title}</span>
                {s.role && (
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-500 uppercase tracking-wide">
                    {ROLE_LABELS[s.role] ?? s.role}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 leading-relaxed prose-steps">
                <ReactMarkdown
                  components={{
                    p:    ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    code: ({ inline, children }) =>
                      inline
                        ? <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[0.8em]">{children}</code>
                        : <code>{children}</code>,
                    pre:  ({ children }) => (
                      <pre className="mt-2 mb-2 p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {s.body}
                </ReactMarkdown>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ResourcesSection({ resources }) {
  if (!resources || resources.length === 0) return null

  const forRole = resources.filter(r => r.role_id !== null)
  const general = resources.filter(r => r.role_id === null)

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Resources</h3>
      <div className="space-y-4">
        {forRole.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">For your role</p>
            <ul className="space-y-1.5">
              {forRole.map(r => (
                <li key={r.id}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {general.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">General</p>
            <ul className="space-y-1.5">
              {general.map(r => (
                <li key={r.id}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export default function ProjectDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [project,    setProject]    = useState(null)
  const [activeRoom, setActiveRoom] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [starting,   setStarting]   = useState(false)
  const [error,      setError]      = useState(null)
  useTitleEffect(project?.title ?? 'Project')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/projects/${id}`),
      api.get('/rooms/my')
    ])
      .then(([projectRes, roomsRes]) => {
        setProject(projectRes.data)
        const match = roomsRes.data.find(
          r => r.project_id === id && r.status !== 'completed'
        )
        setActiveRoom(match ?? null)
      })
      .catch(err => {
        setError(err.response?.status === 404
          ? 'Project not found.'
          : (err.response?.data?.message ?? 'Failed to load project'))
      })
      .finally(() => setLoading(false))
  }, [id])

  async function startProject() {
    setStarting(true)
    setError(null)
    try {
      const { data: room } = await api.post('/rooms', { project_id: id, mode: 'solo' })
      navigate(`/rooms/${room.id}/workspace`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to start project')
      setStarting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
      Loading project…
    </div>
  )

  if (error && !project) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  const functional    = project.requirements.filter(r => r.type === 'functional')
  const nonFunctional = project.requirements.filter(r => r.type === 'non-functional')

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="detail-nav">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <span>{project.title}</span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`badge badge-${project.difficulty}`}>
            {DIFFICULTY_LABELS[project.difficulty]}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
        {project.description && (
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">
            {project.description}
          </p>
        )}
      </div>

      {error && <p className="field-error text-sm" role="alert">{error}</p>}

      {/* Body: main content + CTA sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Requirements + resources */}
        <div className="flex-1 space-y-6">
          <div className="card p-5 space-y-6">
            <RequirementsList title="Functional requirements"     items={functional} />
            <RequirementsList title="Non-functional requirements" items={nonFunctional} />
          </div>

          {project.steps?.length > 0 && (
            <div className="card p-5">
              <ProjectSteps steps={project.steps} />
            </div>
          )}

          {project.responsibilities?.length > 0 && (
            <div className="card p-5">
              <RoleRequirements responsibilities={project.responsibilities} />
            </div>
          )}

          {project.resources?.length > 0 && (
            <div className="card p-5">
              <ResourcesSection resources={project.resources} />
            </div>
          )}
        </div>

        {/* CTA panel */}
        <aside className="lg:w-56 shrink-0">
          <div className="card p-5 sticky top-6 space-y-3">
            {activeRoom ? (
              <>
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => navigate(`/rooms/${activeRoom.id}/workspace`)}
                >
                  Continue project
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Active project ({activeRoom.status})
                </p>
              </>
            ) : (
              <button
                className="btn-primary w-full justify-center"
                onClick={startProject}
                disabled={starting}
              >
                {starting ? 'Starting…' : 'Start project'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
