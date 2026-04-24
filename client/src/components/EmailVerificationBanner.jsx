import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client.js'

const STORAGE_KEY = 'email-banner-dismissed'

export default function EmailVerificationBanner({ user }) {
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  useEffect(() => {
    if (user?.emailVerified) {
      sessionStorage.removeItem(STORAGE_KEY)
      setDismissed(false)
      setSent(false)
    }
  }, [user?.emailVerified])

  async function handleResend() {
    setSending(true)
    setError('')

    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `${window.location.origin}/dashboard`,
      })
      if (resendError) {
        throw resendError
      }
      setSent(true)
    } catch (err) {
      setError(err?.message ?? 'Unable to resend verification email')
    } finally {
      setSending(false)
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  if (!user || user.emailVerified || dismissed) {
    return null
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Verify your email to secure your account.</p>
          <p className="text-sm text-amber-900">
            We sent a verification link to {user.email}. Check your inbox to finish setup.
          </p>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            onClick={handleResend}
            disabled={sending || sent}
          >
            {sending ? 'Sending…' : sent ? 'Sent!' : 'Resend'}
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-amber-800 transition hover:bg-amber-100"
            aria-label="Dismiss email verification banner"
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
