/**
 * Handler for GET /projects/:id
 * Fetches the project, then in parallel:
 *   - all requirements (ordered by type + sort_order)
 *   - responsibilities for the requesting user's role
 *   - resources visible to the user's role (role-specific + general/null)
 *   - activity counts (active builders + lobby waiters + role breakdown)
 */
export async function getProject(request, reply) {
  const { id } = request.params
  const { db }  = request.server
  const roleId  = request.user.roleId ?? null

  // 1. Fetch base project (exclude difficulty_weight — response schema strips it,
  //    but we avoid selecting it at all for clarity)
  const { rows: projectRows } = await db.query(
    `SELECT id, title, description, difficulty, type, created_at
     FROM projects
     WHERE id = $1`,
    [id]
  )

  if (projectRows.length === 0) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found' })
  }

  // 2–6 run in parallel
  const [reqResult, respResult, resResult, stepsResult, activityResult] = await Promise.all([
    // Requirements ordered as spec'd: type first, then sort_order within type
    db.query(
      `SELECT id, type, body, sort_order
       FROM project_requirements
       WHERE project_id = $1
       ORDER BY type, sort_order`,
      [id]
    ),

    // Responsibilities for this user's role (empty array if no role set)
    db.query(
      `SELECT responsibilities
       FROM project_role_responsibilities
       WHERE project_id = $1 AND role_id = $2`,
      [id, roleId]
    ),

    // Resources for this role OR general (role_id IS NULL)
    db.query(
      `SELECT id, label, url, role_id
       FROM project_resources
       WHERE project_id = $1
         AND (role_id = $2 OR role_id IS NULL)
       ORDER BY role_id NULLS LAST, label`,
      [id, roleId]
    ),

    // Steps — all steps ordered by step number
    db.query(
      `SELECT id, step, role, title, body
       FROM project_steps
       WHERE project_id = $1
       ORDER BY step`,
      [id]
    ),

    // Activity counts — active members + lobby waiters + role breakdown
    db.query(
      `SELECT
         COALESCE(active_stats.active_count, 0)::int    AS active_count,
         COALESCE(active_stats.frontend_count, 0)::int  AS frontend_count,
         COALESCE(active_stats.backend_count, 0)::int   AS backend_count,
         COALESCE(active_stats.fullstack_count, 0)::int AS fullstack_count,
         COALESCE(lobby_stats.lobby_count, 0)::int      AS lobby_count
       FROM (SELECT 1) base
       LEFT JOIN (
         SELECT
           COUNT(DISTINCT tm.user_id)
             FILTER (WHERE t.status IN ('active', 'lobby'))              AS active_count,
           COUNT(DISTINCT tm.user_id)
             FILTER (WHERE t.status IN ('active', 'lobby')
                     AND r.name = 'frontend')                            AS frontend_count,
           COUNT(DISTINCT tm.user_id)
             FILTER (WHERE t.status IN ('active', 'lobby')
                     AND r.name = 'backend')                             AS backend_count,
           COUNT(DISTINCT tm.user_id)
             FILTER (WHERE t.status IN ('active', 'lobby')
                     AND r.name = 'fullstack')                           AS fullstack_count
         FROM teams t
         JOIN team_members tm ON tm.team_id = t.id
         JOIN users u         ON u.id = tm.user_id
         LEFT JOIN roles r    ON r.id = u.role_id
         WHERE t.project_id = $1
       ) active_stats ON true
       LEFT JOIN (
         SELECT COUNT(*) AS lobby_count
         FROM matchmaking_queue
         WHERE project_id = $1
       ) lobby_stats ON true`,
      [id]
    )
  ])

  const responsibilities = respResult.rows[0]?.responsibilities ?? []
  const project          = projectRows[0]
  const counts           = activityResult.rows[0]

  const activityCounts = {
    active_count: counts.active_count,
    lobby_count:  counts.lobby_count,
    ...(project.type !== 'solo' && {
      frontend_count:  counts.frontend_count,
      backend_count:   counts.backend_count,
      fullstack_count: counts.fullstack_count,
    })
  }

  return reply.send({
    ...project,
    requirements:    reqResult.rows,
    responsibilities,
    resources:       resResult.rows,
    steps:           stepsResult.rows,
    ...activityCounts,
  })
}
