import { useState, useEffect }           from 'react'
import { useParams, useNavigate, Link }  from 'react-router-dom'
import api                               from '../api/client.js'
import { useTitleEffect }                from '../hooks/useTitleEffect.js'

export default function ProjectDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [project,     setProject]     = useState(null)
  const [activeRoom,  setActiveRoom]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [starting,    setStarting]    = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error,       setError]       = useState(null)
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
      const { data: room } = await api.post('/rooms', { project_id: id })
      navigate(`/rooms/${room.id}/workspace`, { replace: true })
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.room_id) {
        navigate(`/rooms/${err.response.data.room_id}/workspace`, { replace: true })
        return
      }
      setError(err.response?.data?.message ?? 'Failed to start project')
      setStarting(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const response = await api.get(`/projects/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `${id}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setDownloading(false)
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
                  You already have an active session
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
