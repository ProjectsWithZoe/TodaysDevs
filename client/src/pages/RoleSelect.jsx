import { useState }       from 'react'
import { useNavigate }    from 'react-router-dom'
import api                from '../api/client.js'
import { useAuth }        from '../hooks/useAuth.js'
import { useTitleEffect } from '../hooks/useTitleEffect.js'

const ROLES = [
  {
    value: 'frontend',
    label: 'Frontend',
    description: 'HTML, CSS, JavaScript, React',
    icon: '🎨',
  },
  {
    value: 'backend',
    label: 'Backend',
    description: 'Node.js, databases, REST APIs',
    icon: '⚙️',
  },
  {
    value: 'fullstack',
    label: 'Full Stack',
    description: 'Frontend + backend, end-to-end',
    icon: '🚀',
  },
]

export default function RoleSelect() {
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const { updateUser } = useAuth()
  const navigate    = useNavigate()
  useTitleEffect('Choose Your Role')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await api.patch('/users/me/role', { role: selected })
      updateUser({ role: selected })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Choose your focus</h1>
      <p className="text-sm text-slate-500 mb-6">
        Pick your primary track. You can change this later from your profile.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3" role="radiogroup" aria-label="Role selection">
          {ROLES.map(role => {
            const isSelected = selected === role.value
            return (
              <label
                key={role.value}
                className={[
                  'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={isSelected}
                  onChange={() => setSelected(role.value)}
                  className="sr-only"
                />
                <span className="text-lg leading-none mt-0.5" aria-hidden="true">{role.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                    {role.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                </div>
                {isSelected && (
                  <span className="ml-auto text-brand-600 text-sm" aria-hidden="true">✓</span>
                )}
              </label>
            )
          })}
        </div>

        {error && (
          <p className="field-error" role="alert">{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5"
          disabled={!selected || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </span>
          ) : 'Continue →'}
        </button>
      </form>
    </>
  )
}
