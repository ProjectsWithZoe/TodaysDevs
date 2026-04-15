import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Standardised data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApiCall(
 *     () => api.get('/leaderboard/me'),
 *     []        // deps — re-runs when these change
 *   )
 *
 * - Prevents setState on unmounted components via isMounted ref.
 * - `refetch()` can be called to manually re-trigger.
 * - Set config._silent = true on your api call to suppress the global toast.
 */
export function useApiCall(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const execute = useCallback(async () => {
    if (!isMounted.current) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn()
      if (isMounted.current) setData(res.data)
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message ?? err.message ?? 'Request failed')
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { execute() }, [execute])

  return { data, loading, error, refetch: execute }
}
