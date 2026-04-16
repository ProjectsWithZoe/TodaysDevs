import { useState, useEffect }    from 'react'
import { useParams, Link }        from 'react-router-dom'
import api                        from '../api/client.js'
import { useTitleEffect }         from '../hooks/useTitleEffect.js'
import { SubmissionStatus }       from '../components/SubmissionStatus.jsx'
import { SubmissionLock }         from '../components/SubmissionLock.jsx'

export default function SoloWorkspace() {
  const { id } = useParams()
  const [room,       setRoom]       = useState(null)
  const [project,    setProject]    = useState(null)
  const [submission, setSubmission] = useState(null)
  const [isLocked,   setIsLocked]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [downloading, setDownloading] = useState(false)
  useTitleEffect(project ? `${project.title} — Workspace` : 'Workspace')

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

  async function handleDownload() {
    setDownloading(true)
    try {
      const response = await api.get(`/projects/${room.project_id}/download`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `${room.project_id}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can retry
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
      Loading workspace…
    </div>
  )
  if (error) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-slate-500">{error}</p>
      <Link to="/projects" className="btn-secondary btn-sm">← Back to projects</Link>
    </div>
  )

  return (
    <div className="space-y-5">
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
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main */}
        <div className="flex-1 space-y-5">
          {project.description && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">About this project</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Getting started</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Download the project files to get started. Full instructions are in the
              <strong className="text-slate-700"> README</strong> inside the zip.
            </p>
            <button
              className="btn-secondary mt-3"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Preparing download…' : 'Download project files'}
            </button>
          </div>
        </div>

        {/* Aside */}
        <aside className="lg:w-60 shrink-0 space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Submit project</h3>
            {submission ? (
              <SubmissionStatus submission={submission} />
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  When you're done, submit your repository link for review.
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
