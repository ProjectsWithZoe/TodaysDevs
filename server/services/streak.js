export { calculateStreakMultiplier } from './scoring.js'

/**
 * Updates (or initialises) a user's streak in leaderboard_scores.
 *
 * Rules:
 *   last_active = today      → no-op
 *   last_active = yesterday  → streak_days += 1
 *   older / no row           → streak_days = 1 (reset / first visit)
 *
 * Fire-and-forget from authenticate.js — must never throw.
 *
 * @param {number} userId
 * @param {import('pg').Pool} db
 */
export async function touchStreak(userId, db) {
  const today     = new Date().toISOString().split('T')[0]          // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString().split('T')[0]

  const { rows: [row] } = await db.query(
    'SELECT last_active, streak_days FROM leaderboard_scores WHERE user_id = $1',
    [userId]
  )

  if (!row) {
    // First visit — seed the row; scoring will fill score columns later
    await db.query(
      `INSERT INTO leaderboard_scores (user_id, streak_days, last_active)
       VALUES ($1, 1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, today]
    )
    return
  }

  const lastActive = row.last_active instanceof Date
    ? row.last_active.toISOString().split('T')[0]
    : String(row.last_active).slice(0, 10)

  if (lastActive === today)     return   // already touched today

  const newStreak = lastActive === yesterday ? row.streak_days + 1 : 1

  await db.query(
    `UPDATE leaderboard_scores
     SET streak_days = $1, last_active = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [newStreak, today, userId]
  )
}
