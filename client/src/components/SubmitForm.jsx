import { useState }      from 'react'
import { useNavigate }   from 'react-router-dom'
import api               from '../api/client.js'

const ALLOWED_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org']
const MAX_NOTES     = 500

function validateRepoUrl(value) {
  if (!value.trim()) return 'Repository URL is required'
  try {
    const { hostname } = new URL(value)
    if (!ALLOWED_HOSTS.includes(hostname))
      return `URL must be from: ${ALLOWED_HOSTS.join(', ')}`
  } catch {
    return 'Enter a valid URL (e.g. https://github.com/user/repo)'
  }
  return null
}

export function SubmitForm({ teamId, roomId }) {
  const navigate = useNavigate()

  const [repoUrl,     setRepoUrl]     = useState('')
  const [notes,       setNotes]       = useState('')
  const [urlError,    setUrlError]    = useState(null)
  const [formError,   setFormError]   = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  function handleUrlBlur() { setUrlError(validateRepoUrl(repoUrl)) }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateRepoUrl(repoUrl)
    setUrlError(err)
    if (err) return
    setSubmitting(true)
    setFormError(null)
    try {
      await api.post('/submissions', {
        team_id:  teamId,
        repo_url: repoUrl.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {})
      })
      navigate(`/rooms/${roomId}/workspace`, { replace: true })
    } catch (apiErr) {
      const status  = apiErr.response?.status
      const message = apiErr.response?.data?.message ?? 'Submission failed'
      if (status === 409) {
        setAlreadyDone(true)
        setFormError('Already submitted')
      } else {
        setFormError(message)
        setSubmitting(false)
      }
    }
  }

  if (alreadyDone) {
    return (
      <div className="card p-5 flex items-center gap-3 text-amber-700 bg-amber-50 border-amber-200">
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-medium">This team has already submitted a project.</p>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="field-error text-sm" role="alert">{formError}</p>
      )}

      <div>
        <label htmlFor="repo_url" className="field-label">
          Repository URL <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="repo_url"
          type="url"
          className={`field-input ${urlError ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://github.com/your-org/your-repo"
          disabled={submitting}
          aria-describedby={urlError ? 'repo-url-error' : 'repo-url-hint'}
          aria-invalid={urlError ? 'true' : undefined}
        />
        {urlError ? (
          <p id="repo-url-error" className="field-error" role="alert">{urlError}</p>
        ) : (
          <p id="repo-url-hint" className="field-hint">
            Accepted: {ALLOWED_HOSTS.join(', ')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="field-label">
          Notes
          <span className="ml-1 font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          className="field-input resize-none"
          value={notes}
          onChange={e => setNotes(e.target.value.slice(0, MAX_NOTES))}
          rows={4}
          placeholder="Anything the reviewer should know…"
          disabled={submitting}
        />
        <p className="field-hint text-right">{notes.length} / {MAX_NOTES}</p>
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={submitting}>
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Submitting…
          </span>
        ) : 'Submit project'}
      </button>
    </form>
  )
}
