import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authClient } from '../lib/auth-client.js'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = useMemo(
    () => new URLSearchParams(location.search).get('token'),
    [location.search]
  )
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/auth/forgot-password', { replace: true })
    }
  }, [navigate, token])

  async function handleSubmit(event) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token,
      })
      if (resetError) {
        throw resetError
      }
      toast.success('Password updated. You can sign in now.')
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset successful. Please sign in.' },
      })
    } catch (err) {
      setError(err?.message ?? 'This reset link is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Set a new password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="field-error text-sm" role="alert">{error}</p>
        )}

        <div>
          <label htmlFor="newPassword" className="field-label">New password</label>
          <input
            id="newPassword"
            type="password"
            className="field-input"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            className="field-input"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5"
          disabled={loading}
        >
          {loading ? 'Updating password…' : 'Reset password'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  )
}
