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
          {projects.map(p => <ProjectCard key={p.id} id={p.id} title={p.title} description={p.description} repo={p.repo} />)}
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
