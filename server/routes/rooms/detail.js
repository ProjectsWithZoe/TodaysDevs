const ROOM_QUERY = `
  SELECT
    t.id, t.project_id, t.created_by, t.mode, t.status, t.join_code, t.created_at,
    json_build_object('title', t.project_title) AS project,
    COALESCE(
      json_agg(
        json_build_object(
          'user_id',      tm.user_id,
          'display_name', u.email,
          'role',         r.name,
          'joined_at',    tm.joined_at
        ) ORDER BY tm.joined_at
      ) FILTER (WHERE tm.user_id IS NOT NULL),
      '[]'::json
    ) AS members
  FROM teams t
  LEFT JOIN team_members tm ON tm.team_id = t.id
  LEFT JOIN users u         ON u.id = tm.user_id
  LEFT JOIN roles r         ON r.id = u.role_id
  WHERE t.id = $1
  GROUP BY t.id
`

/** Shared helper used by create and detail handlers */
export async function fetchRoom(db, teamId) {
  const { rows } = await db.query(ROOM_QUERY, [teamId])
  return rows[0] ?? null
}

export async function getRoomDetail(request, reply) {
  const { id } = request.params
  const room = await fetchRoom(request.server.db, id)
  if (!room) {
    return reply.code(404).send({ error: 'Not Found', message: 'Room not found' })
  }
  return reply.send(room)
}
