import { findRoleReplacement } from '../../services/matchmaker.js'

const ROOM_QUERY = `
  SELECT
    t.id, t.project_id, t.created_by, t.mode, t.status, t.join_code, t.created_at,
    t.partner_left_at, t.seeking_role,
    json_build_object(
      'title',      p.title,
      'difficulty', p.difficulty,
      'type',       p.type
    ) AS project,
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
  JOIN projects p       ON p.id  = t.project_id
  LEFT JOIN team_members tm ON tm.team_id = t.id
  LEFT JOIN users u     ON u.id  = tm.user_id
  LEFT JOIN roles r     ON r.id  = u.role_id
  WHERE t.id = $1
  GROUP BY t.id, p.title, p.difficulty, p.type
`

/** Shared helper used by create, join, start, and detail handlers */
export async function fetchRoom(db, teamId) {
  const { rows } = await db.query(ROOM_QUERY, [teamId])
  return rows[0] ?? null
}

export async function getRoomDetail(request, reply) {
  const teamId = request.params.id
  const db     = request.server.db

  // requireMember already verified membership; just fetch and return
  let room = await fetchRoom(db, teamId)
  if (!room) {
    return reply.code(404).send({ error: 'Not Found', message: 'Room not found' })
  }

  // ── Lazy dissolve check (duo timeout) ──────────────────────────────────────
  if (room.status === 'partner_left' && room.partner_left_at) {
    const elapsed = Date.now() - new Date(room.partner_left_at).getTime()
    if (elapsed > 5 * 60 * 1000) {
      await db.query(
        `UPDATE teams SET status = 'dissolved' WHERE id = $1`,
        [teamId]
      )
      room = { ...room, status: 'dissolved' }
    }
  }

  // ── Lazy replacement check (team seeking_replacement) ─────────────────────
  if (room.status === 'seeking_replacement' && room.seeking_role) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // Re-lock the team row to prevent races
      const { rows: [locked] } = await client.query(
        'SELECT status, seeking_role, project_id, mode FROM teams WHERE id = $1 FOR UPDATE',
        [teamId]
      )

      if (locked && locked.status === 'seeking_replacement') {
        const { rows: queueEntries } = await client.query(
          `SELECT mq.id, mq.user_id, mq.project_id, mq.mode,
                  mq.role_id, mq.experience_level, mq.queued_at,
                  r.name AS role
           FROM matchmaking_queue mq
           LEFT JOIN roles r ON r.id = mq.role_id
           WHERE mq.project_id = $1 AND mq.mode = $2
           ORDER BY mq.queued_at ASC
           FOR UPDATE OF mq`,
          [locked.project_id, locked.mode]
        )

        const replacement = findRoleReplacement(locked.seeking_role, queueEntries, locked.project_id)

        if (replacement) {
          await client.query(
            'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
            [teamId, replacement.user_id]
          )
          await client.query(
            'DELETE FROM matchmaking_queue WHERE user_id = $1',
            [replacement.user_id]
          )
          await client.query(
            `UPDATE teams SET status = 'active', seeking_role = NULL WHERE id = $1`,
            [teamId]
          )
          await client.query('COMMIT')

          // Re-fetch to return updated state
          room = await fetchRoom(db, teamId)
        } else {
          await client.query('ROLLBACK')
        }
      } else {
        await client.query('ROLLBACK')
      }
    } catch (err) {
      await client.query('ROLLBACK')
      request.log.error(err, 'lazy replacement check failed')
    } finally {
      client.release()
    }
  }

  return reply.send(room)
}
