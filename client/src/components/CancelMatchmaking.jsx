import { useState } from 'react'
import api          from '../api/client.js'

export function CancelMatchmaking({ onCancelled }) {
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error,      setError]      = useState(null)

  async function handleConfirm() {
    setCancelling(true)
    setError(null)
    try {
      await api.delete('/matchmaking/queue')
      onCancelled()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to cancel')
      setCancelling(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button className="btn-ghost btn-sm" onClick={() => setConfirming(true)}>
        Cancel search
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-slate-600">Leave the queue?</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-danger btn-sm" onClick={handleConfirm} disabled={cancelling}>
          {cancelling ? 'Cancelling…' : 'Yes, cancel'}
        </button>
        <button className="btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={cancelling}>
          Keep waiting
        </button>
      </div>
    </div>
  )
}
