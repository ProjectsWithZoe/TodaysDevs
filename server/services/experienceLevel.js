/**
 * Derives a user's experience level (1–3) from their accepted submission count.
 *
 * 0       → 1  (beginner)
 * 1–3     → 2  (intermediate)
 * 4+      → 3  (experienced)
 *
 * If the submissions table does not exist yet, returns 1 as a safe default.
 */
export async function getExperienceLevel(db, userId) {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM submissions
       WHERE user_id = $1 AND status = 'accepted'`,
      [userId]
    )
    const count = rows[0]?.count ?? 0
    if (count === 0) return 1
    if (count <= 3)  return 2
    return 3
  } catch {
    // submissions table not yet created — default to 1
    return 1
  }
}
