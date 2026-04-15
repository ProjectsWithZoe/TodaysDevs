/**
 * PATCH /rooms/:id/partner-decision
 *
 * Called by the remaining partner in a duo room after their partner left.
 * body: { "decision": "requeue" | "dissolve" }
 *
 *   requeue  — re-queues the remaining partner and dissolves the room
 *   dissolve — dissolves the room without re-queuing
 */
export async function partnerDecision(request, reply) {
  const teamId   = request.params.id
  const userId   = request.user.sub
  const { decision } = request.body
  const db       = request.server.db

  if (!['requeue', 'dissolve'].includes(decision)) {
    return reply.code(400).send({ error: 'Bad Request', message: 'decision must be "requeue" or "dissolve"' })
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Lock and fetch team
    const { rows: [team] } = await client.query(
      `SELECT id, mode, status, project_id
       FROM teams
       WHERE id = $1
       FOR UPDATE`,
      [teamId]
    )

    if (!team) {
      await client.query('ROLLBACK')
      return reply.code(404).send({ error: 'Not Found', message: 'Room not found' })
    }

    if (team.status !== 'partner_left') {
      await client.query('ROLLBACK')
      return reply.code(409).send({ error: 'Conflict', message: 'Room is not in partner_left state' })
    }

    // Verify caller is still a member
    const { rows: membership } = await client.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    )
    if (membership.length === 0) {
      await client.query('ROLLBACK')
      return reply.code(403).send({ error: 'Forbidden', message: 'Not a member of this room' })
    }

    if (decision === 'requeue') {
      // Re-queue the remaining partner with fresh queued_at
      const { rows: [userInfo] } = await client.query(
        `SELECT u.role_id,
                COALESCE(ls.score_count, 1) AS experience_level
         FROM users u
         LEFT JOIN (
           SELECT user_id, LEAST(3, FLOOR(COUNT(*) / 3)::int + 1) AS score_count
           FROM leaderboard_scores
           WHERE user_id = $1
           GROUP BY user_id
         ) ls ON ls.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      )

      await client.query(
        `INSERT INTO matchmaking_queue
           (user_id, project_id, mode, role_id, experience_level, queued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           project_id       = EXCLUDED.project_id,
           mode             = EXCLUDED.mode,
           role_id          = EXCLUDED.role_id,
           experience_level = EXCLUDED.experience_level,
           queued_at        = NOW()`,
        [userId, team.project_id, team.mode, userInfo?.role_id ?? null, userInfo?.experience_level ?? 1]
      )
    }

    // Dissolve the room in both cases
    await client.query(
      `UPDATE teams SET status = 'dissolved' WHERE id = $1`,
      [teamId]
    )

    await client.query('COMMIT')
    return reply.send({ status: 'dissolved', requeued: decision === 'requeue' })

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
