import { useState, useEffect } from 'react'
import api                    from '../api/client.js'
import { useTitleEffect }     from '../hooks/useTitleEffect.js'
import { ProjectFilters }     from '../components/ProjectFilters.jsx'
import { ProjectCard }        from '../components/ProjectCard.jsx'

const DEFAULT_FILTERS = { difficulty: '', type: '', limit: 20, offset: 0 }

const TABS = [
  { id: 'web',    label: 'HTML / CSS / JS' },
  { id: 'python', label: 'Python' },
]

function SkeletonProjectCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse" aria-hidden="true">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-10 rounded-full" />
      </div>
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
      </div>
    </div>
  )
}

function PythonProjectCard({ name, html_url, description }) {
  return (
    <a
      href={html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          Python
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-2">
          {name.replace(/-/g, ' ').replace(/_/g, ' ')}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{description}</p>
        )}
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        View on GitHub
      </p>
    </a>
  )
}

function WebProjectsTab({ filters, setFilters }) {
  const [projects, setProjects] = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = {}
    if (filters.difficulty) params.difficulty = filters.difficulty
    if (filters.type)       params.type       = filters.type
    params.limit  = filters.limit
    params.offset = filters.offset

    api.get('/projects', { params })
      .then(({ data }) => {
        if (cancelled) return
        setProjects(data.data)
        setTotal(data.total)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load projects')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [filters])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          {!loading && (
            <p className="text-sm text-slate-500">
              {total} project{total !== 1 ? 's' : ''} available
            </p>
          )}
        </div>
        <ProjectFilters filters={filters} onChange={setFilters} />
      </div>

      {error && <p className="field-error text-sm" role="alert">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => <SkeletonProjectCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-slate-600">No projects match your filters</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting the difficulty or type</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} {...p} />)}
        </div>
      )}
    </>
  )
}

function PythonProjectsTab() {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api.get('/projects/python')
      .then(({ data }) => {
        if (cancelled) return
        setProjects(data.data)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.response?.data?.message ?? 'Failed to load Python projects')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  if (error) return <p className="field-error text-sm" role="alert">{error}</p>

  return (
    <>
      {!loading && (
        <p className="text-sm text-slate-500">
          {projects.length} project{projects.length !== 1 ? 's' : ''} available
        </p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => <SkeletonProjectCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => <PythonProjectCard key={p.id} name={p.title} html_url={p.html_url} description={p.description} />)}
        </div>
      )}
    </>
  )
}

export default function ProjectBrowser() {
  const [activeTab, setActiveTab] = useState('web')
  const [filters,   setFilters]   = useState(DEFAULT_FILTERS)
  useTitleEffect('Projects')

  return (
    <div className="space-y-5">
      {/* Header */}
      <h2 className="text-2xl font-bold text-slate-800">Projects</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'web'
        ? <WebProjectsTab filters={filters} setFilters={setFilters} />
        : <PythonProjectsTab />
      }
    </div>
  )
}
