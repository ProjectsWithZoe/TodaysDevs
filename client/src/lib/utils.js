/**
 * Format an ISO timestamp → "14 Apr 2026"
 */
export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric'
  })
}

/**
 * Format a score integer with locale separators → "12,345"
 */
export function formatScore(n) {
  return (n ?? 0).toLocaleString()
}

/**
 * Relative time — "2 hours ago", "just now", etc.
 */
export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const sec  = Math.floor(diff / 1000)
  if (sec < 60)           return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60)           return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24)            return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30)           return `${day}d ago`
  const mo = Math.floor(day / 30)
  if (mo < 12)            return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

/**
 * Merge class names, filtering falsy values.
 * Lightweight substitute for clsx.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Truncate a string to `n` characters, appending "…" if cut.
 */
export function truncate(str, n) {
  if (!str || str.length <= n) return str ?? ''
  return str.slice(0, n).trimEnd() + '…'
}
