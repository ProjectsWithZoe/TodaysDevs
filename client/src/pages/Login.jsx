import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authClient } from '../lib/auth-client.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await authClient.signIn.email({ email, password })

    if (err) {
      setError('Sign-in failed. Please check your email and password and try again')
      setLoading(false)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sign in</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back</p>
        {location.state?.message && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {location.state.message}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="field-error text-sm" role="alert">{error}</p>
        )}

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            type="password"
            className="field-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="mt-2 text-right">
            <Link
              to="/auth/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-slate-500 text-center">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
          Register
        </Link>
      </p>
    </div>
  )
}
