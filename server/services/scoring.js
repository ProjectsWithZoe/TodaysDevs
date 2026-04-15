/**
 * Scoring service — pure functions + DB-backed compute/upsert.
 *
 * Pure functions are fully unit-testable with no imports.
 * DB functions take an explicit `db` (pg.Pool) argument.
 */

// ── Pure functions ──────────────────────────────────────────────────────────

/**
 * Base score split for one member of a submission.
 * @param {number} difficultyWeight   1 | 2 | 3
 * @param {'solo'|'duo'|'team'} mode
 * @param {number} memberCount        total members on the team
 * @returns {number} integer score for this member
 */
export function calculateBaseScore(difficultyWeight, mode, memberCount) {
  const base = difficultyWeight * 100
  if (mode === 'solo') return base
  if (mode === 'duo')  return Math.floor(base / 2)
  // team
  return Math.floor(base / memberCount)
}

/**
 * Participation bonus for one member of one submission.
 * @param {number} tasksCompleted  tasks with status='done' assigned to this user in this team
 * @param {number} messagesSent    chat messages sent by this user in this team
 * @returns {number} integer bonus ≤ 75
 */
export function calculateBonus(tasksCompleted, messagesSent) {
  const taskBonus  = Math.min(tasksCompleted * 10, 50)
  const chatBonus  = Math.min(Math.floor(messagesSent / 10) * 5, 25)
  return Math.min(taskBonus + chatBonus, 75)
}

/**
 * Streak multiplier.
 *   0 days      → 1.00
 *   1–7 days    → 1.00 + (streakDays / 7) × 0.25
 *   8–30 days   → 1.25 + ((streakDays - 7) / 23) × 0.25
 *   >30 days    → capped at 1.50
 * @param {number} streakDays
 * @returns {number} float in [1.0, 1.5]
 */
export function calculateStreakMultiplier(streakDays) {
  if (streakDays <= 0)  return 1.0
  if (streakDays <= 7)  return 1.0  + (streakDays / 7)        * 0.25
  if (streakDays <= 30) return 1.25 + ((streakDays - 7) / 23) * 0.25
  return 1.5
}

/**
 * Apply streak multiplier to a raw score, returning an integer.
 * @param {number} rawScore
 * @param {number} streakDays
 * @returns {number}
 */
export function applyStreakMultiplier(rawScore, streakDays) {
  return Math.floor(rawScore * calculateStreakMultiplier(streakDays))
}

// ── DB-backed functions ─────────────────────────────────────────────────────

/**
 * Recomputes the full score breakdown for a user from their submission history.
 * Does NOT apply streak multiplier — that is applied in updateScore().
 *
 * Tables accessed: submissions, team_members, teams, projects
 *   + tasks (graceful fallback if missing)
 *   + messages (graceful fallback if missing)
 *
 * @returns {{ totalScore, soloScore, duoScore, teamScore, projectsCompleted }}
 */
export async function computeUserScore(userId, db) {
  // All accepted submissions this user is a member of
  const { rows: submissions } = await db.query(
    `SELECT s.id AS submission_id, s.team_id, t.mode, t.project_id,
            p.difficulty_weight
     FROM submissions s
     JOIN teams t       ON t.id = s.team_id
     JOIN projects p    ON p.id = t.project_id
     JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
     WHERE s.status = 'accepted'`,
    [userId]
  )

  let soloScore = 0, duoScore = 0, teamScore = 0

  for (const sub of submissions) {
    // Member count for this team
    const { rows: [mc] } = await db.query(
      'SELECT COUNT(*)::int AS count FROM team_members WHERE team_id = $1',
      [sub.team_id]
    )
    const memberCount = mc.count

    const base = calculateBaseScore(sub.difficulty_weight, sub.mode, memberCount)

    // Task bonus — degrade gracefully if tasks table absent
    let tasksCompleted = 0
    try {
      const { rows: [tc] } = await db.query(
        `SELECT COUNT(*)::int AS count FROM tasks
         WHERE team_id = $1 AND assigned_to = $2 AND status = 'done'`,
        [sub.team_id, userId]
      )
      tasksCompleted = tc.count ?? 0
    } catch { /* tasks table not yet created */ }

    // Chat bonus — degrade gracefully if messages table absent
    let messagesSent = 0
    try {
      const { rows: [ms] } = await db.query(
        `SELECT COUNT(*)::int AS count FROM messages
         WHERE team_id = $1 AND user_id = $2`,
        [sub.team_id, userId]
      )
      messagesSent = ms.count ?? 0
    } catch { /* messages table not yet created */ }

    const bonus       = calculateBonus(tasksCompleted, messagesSent)
    const rawPoints   = base + bonus

    if      (sub.mode === 'solo') soloScore += rawPoints
    else if (sub.mode === 'duo')  duoScore  += rawPoints
    else                          teamScore += rawPoints
  }

  return {
    totalScore:         soloScore + duoScore + teamScore,
    soloScore,
    duoScore,
    teamScore,
    projectsCompleted:  submissions.length
  }
}

/**
 * Recomputes and upserts a user's leaderboard row.
 * Preserves existing streak_days / last_active.
 * @param {number} userId
 * @param {import('pg').Pool} db
 */
export async function updateScore(userId, db) {
  const { totalScore, soloScore, duoScore, teamScore, projectsCompleted } =
    await computeUserScore(userId, db)

  // Fetch current streak (or 0 for new users)
  const { rows: [existing] } = await db.query(
    'SELECT streak_days FROM leaderboard_scores WHERE user_id = $1',
    [userId]
  )
  const streakDays  = existing?.streak_days ?? 0
  const finalScore  = applyStreakMultiplier(totalScore, streakDays)
  const finalSolo   = applyStreakMultiplier(soloScore,  streakDays)
  const finalDuo    = applyStreakMultiplier(duoScore,   streakDays)
  const finalTeam   = applyStreakMultiplier(teamScore,  streakDays)

  await db.query(
    `INSERT INTO leaderboard_scores
       (user_id, score, solo_score, duo_score, team_score, projects_completed)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       score              = EXCLUDED.score,
       solo_score         = EXCLUDED.solo_score,
       duo_score          = EXCLUDED.duo_score,
       team_score         = EXCLUDED.team_score,
       projects_completed = EXCLUDED.projects_completed,
       updated_at         = NOW()`,
    [userId, finalScore, finalSolo, finalDuo, finalTeam, projectsCompleted]
  )
}
