/**
 * Handler for GET /projects
 * Filters by difficulty/type, paginates, and LEFT JOINs responsibilities
 * for the requesting user's role so the client knows how many tasks await them.
 * Also aggregates live activity counts (active builders + lobby waiters) per project.
 */
export async function listProjects(request, reply) {
  const { difficulty, type, limit = 20, offset = 0 } = request.query
  const roleId = request.user.roleId ?? null

  // Build WHERE clause dynamically — avoids casting NULL to the enum type
  const conditions = []
  const params = [roleId]   // $1 = roleId (may be null)
  let pi = 2

  if (difficulty) {
    conditions.push(`p.difficulty = $${pi++}::project_difficulty`)
    params.push(difficulty)
  }
  if (type) {
    conditions.push(`p.type = $${pi++}::project_type`)
    params.push(type)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(limit, offset)                        // $pi, $pi+1
  const limitIdx  = pi
  const offsetIdx = pi + 1

  const { rows } = await request.server.db.query(
    `SELECT
       p.id, p.title, p.description, p.difficulty, p.type, p.created_at,
       COALESCE(array_length(prr.responsibilities, 1), 0)::int AS responsibilities_count,
       COALESCE(active_stats.active_count, 0)::int             AS active_count,
       COALESCE(active_stats.frontend_count, 0)::int           AS frontend_count,
       COALESCE(active_stats.backend_count, 0)::int            AS backend_count,
       COALESCE(active_stats.fullstack_count, 0)::int          AS fullstack_count,
       COALESCE(lobby_stats.lobby_count, 0)::int               AS lobby_count,
       COUNT(*) OVER()::int AS total
     FROM projects p
     LEFT JOIN project_role_responsibilities prr
       ON prr.project_id = p.id AND prr.role_id = $1
     LEFT JOIN (
       SELECT
         t.project_id,
         COUNT(DISTINCT tm.user_id)
           FILTER (WHERE t.status IN ('active', 'lobby'))                 AS active_count,
         COUNT(DISTINCT tm.user_id)
           FILTER (WHERE t.status IN ('active', 'lobby')
                   AND r.name = 'frontend')                               AS frontend_count,
         COUNT(DISTINCT tm.user_id)
           FILTER (WHERE t.status IN ('active', 'lobby')
                   AND r.name = 'backend')                                AS backend_count,
         COUNT(DISTINCT tm.user_id)
           FILTER (WHERE t.status IN ('active', 'lobby')
                   AND r.name = 'fullstack')                              AS fullstack_count
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       JOIN users u         ON u.id = tm.user_id
       LEFT JOIN roles r    ON r.id = u.role_id
       GROUP BY t.project_id
     ) active_stats ON active_stats.project_id = p.id
     LEFT JOIN (
       SELECT project_id, COUNT(*) AS lobby_count
       FROM matchmaking_queue
       GROUP BY project_id
     ) lobby_stats ON lobby_stats.project_id = p.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  )

  const total = rows[0]?.total ?? 0

  // Strip the window-function column; omit role counts for solo projects
  const data = rows.map(({ total: _t, frontend_count, backend_count, fullstack_count, ...rest }) => {
    const project = rest
    if (project.type !== 'solo') {
      project.frontend_count  = frontend_count
      project.backend_count   = backend_count
      project.fullstack_count = fullstack_count
    }
    return project
  })

  return reply.send({ data, total, limit: Number(limit), offset: Number(offset) })
}
