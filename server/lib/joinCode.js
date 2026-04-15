import crypto from 'crypto'

/**
 * Generate a short, human-readable room join code.
 * e.g. "A3F7K2" — 6 uppercase alphanumeric characters.
 */
export function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}
