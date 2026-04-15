/**
 * Creates a pg.Pool with SSL configured explicitly, bypassing the
 * pg-connection-string SSL-mode parser (which treats sslmode=require as
 * verify-full in pg v8 / pg-connection-string v2, causing ECONNRESET).
 *
 * Strategy: strip ssl/channel_binding params from the URL so the parser
 * never touches them, then set ssl ourselves.
 */
import pg from 'pg'

function cleanUrl(raw) {
  const url = new URL(raw)
  url.searchParams.delete('sslmode')
  url.searchParams.delete('channel_binding')
  url.searchParams.delete('uselibpqcompat')
  return url.toString()
}

export function makePool(opts = {}) {
  const isProduction = process.env.NODE_ENV === 'production'
  return new pg.Pool({
    connectionString: cleanUrl(process.env.DATABASE_URL),
    ssl: isProduction
      ? { rejectUnauthorized: true }   // verify cert in production
      : { rejectUnauthorized: false }, // dev/staging: skip cert check
    ...opts,
  })
}
