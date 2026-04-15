import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from '../lib/auth-client.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (requestError) {
        throw requestError
      }
      setSubmitted(true)
    } catch (err) {
      setError(err?.message ?? 'Unable to request a reset right now')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Check your inbox</h1>
          <p className="mt-2 text-sm text-slate-500">
            If that email is registered, a reset link is on its way.
          </p>
        </div>

        <Link to="/login" className="btn-secondary w-full justify-center py-2.5">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Forgot your password?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
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
            onChange={event => setEmail(event.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5"
          disabled={loading}
        >
          {loading ? 'Sending reset link…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  )
}
