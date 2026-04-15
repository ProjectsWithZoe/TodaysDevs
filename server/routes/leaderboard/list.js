const SCORE_COL = {
  solo:   'ls.solo_score',
  duo:    'ls.duo_score',
  team:   'ls.team_score',
  global: 'ls.score'
}

export async function listLeaderboard(request, reply) {
  const { type = 'global', role, limit = 20, offset = 0 } = request.query
  const db = request.server.db

  const scoreCol = SCORE_COL[type] ?? 'ls.score'

  const params  = []
  const filters = []

  if (role) {
    params.push(role)
    filters.push(`r.name = $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  params.push(limit, offset)
  const limitIdx  = params.length - 1
  const offsetIdx = params.length

  const { rows } = await db.query(
    `SELECT
       RANK() OVER (ORDER BY ${scoreCol} DESC)::int AS rank,
       ls.user_id,
       ls.score,
       ls.solo_score,
       ls.duo_score,
       ls.team_score,
       ls.projects_completed,
       ls.streak_days,
       u.email   AS display_name,
       r.name    AS role,
       COUNT(*) OVER ()::int AS total
     FROM leaderboard_scores ls
     JOIN users u ON u.id = ls.user_id
     LEFT JOIN roles r ON r.id = u.role_id
     ${whereClause}
     ORDER BY ${scoreCol} DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  )

  const total = rows[0]?.total ?? 0
  const data  = rows.map(({ total: _t, ...rest }) => rest)

  return reply.send({ data, total, limit, offset })
}
