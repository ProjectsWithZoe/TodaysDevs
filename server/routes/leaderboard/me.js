const EMPTY_ROW = {
  rank:               null,
  score:              0,
  solo_score:         0,
  duo_score:          0,
  team_score:         0,
  projects_completed: 0,
  streak_days:        0
}

export async function getMyLeaderboard(request, reply) {
  const userId = request.user.sub
  const db     = request.server.db

  const { rows: [row] } = await db.query(
    `SELECT ls.score, ls.solo_score, ls.duo_score, ls.team_score,
            ls.projects_completed, ls.streak_days, ls.last_active
     FROM leaderboard_scores ls
     WHERE ls.user_id = $1`,
    [userId]
  )

  if (!row) {
    return reply.send(EMPTY_ROW)
  }

  // Global rank: how many users have a HIGHER score + 1
  const { rows: [rankRow] } = await db.query(
    `SELECT (COUNT(*) + 1)::int AS rank
     FROM leaderboard_scores
     WHERE score > $1`,
    [row.score]
  )

  return reply.send({
    rank:               rankRow.rank,
    score:              row.score,
    solo_score:         row.solo_score,
    duo_score:          row.duo_score,
    team_score:         row.team_score,
    projects_completed: row.projects_completed,
    streak_days:        row.streak_days,
    last_active:        row.last_active
  })
}
