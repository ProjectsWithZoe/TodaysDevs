import { findRoleReplacement } from '../../services/matchmaker.js'

/**
 * POST /rooms/:id/leave
 *
 * Removes the authenticated user from an active room.
 * Behaviour differs by mode:
 *
 *   solo — dissolves the room for the leaving user
 *   duo  — sets status='partner_left'; optionally re-queues the leaver
 *   team — attempts immediate role replacement; if none found, sets 'seeking_replacement'
 */
export async function leaveRoom(request, reply) {
  const teamId = request.params.id
  const userId = request.user.sub
  const db     = request.server.db
  const shouldRequeue = request.body?.requeue !== false

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Lock the team row and verify caller is a member
    const { rows: [team] } = await client.query(
      `SELECT t.id, t.mode, t.status, t.project_id
       FROM teams t
       WHERE t.id = $1
       FOR UPDATE`,
      [teamId]
    )

    if (!team) {
      await client.query('ROLLBACK')
      return reply.code(404).send({ error: 'Not Found', message: 'Room not found' })
    }

    const { rows: membership } = await client.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    )
    if (membership.length === 0) {
      await client.query('ROLLBACK')
      return reply.code(403).send({ error: 'Forbidden', message: 'Not a member of this room' })
    }

    // Fetch the leaver's role for team replacement logic
    const { rows: [leaverRow] } = await client.query(
      `SELECT r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [userId]
    )
    const leavingRole = leaverRow?.role ?? null

    // Remove leaver from team
    await client.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    )

    if (team.mode === 'solo') {
      await client.query(
        `UPDATE teams
         SET status = 'dissolved',
             partner_left_at = NULL,
             seeking_role = NULL
         WHERE id = $1`,
        [teamId]
      )

      await client.query('COMMIT')
      return reply.send({ status: 'dissolved', requeued: false })
    }

    if (shouldRequeue) {
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
    } else {
      await client.query(
        'DELETE FROM matchmaking_queue WHERE user_id = $1',
        [userId]
      )
    }

    if (team.mode === 'duo') {
      // ── Duo leave ────────────────────────────────────────────────────────
      await client.query(
        `UPDATE teams SET status = 'partner_left', partner_left_at = NOW()
         WHERE id = $1`,
        [teamId]
      )

      await client.query('COMMIT')
      return reply.send({ status: 'partner_left', requeued: shouldRequeue })
    }

    // ── Team leave ───────────────────────────────────────────────────────────

    // Load current queue for this project+mode to find a replacement
    const { rows: queueEntries } = await client.query(
      `SELECT mq.id, mq.user_id, mq.project_id, mq.mode,
              mq.role_id, mq.experience_level, mq.queued_at,
              r.name AS role
       FROM matchmaking_queue mq
       LEFT JOIN roles r ON r.id = mq.role_id
       WHERE mq.project_id = $1 AND mq.mode = $2
       ORDER BY mq.queued_at ASC
       FOR UPDATE OF mq`,
      [team.project_id, team.mode]
    )

    const replacement = findRoleReplacement(leavingRole, queueEntries, team.project_id)

    if (replacement) {
      // Check the room is still in a joinable state
      const { rows: [currentTeam] } = await client.query(
        'SELECT status FROM teams WHERE id = $1',
        [teamId]
      )
      if (!currentTeam || currentTeam.status === 'dissolved') {
        await client.query('ROLLBACK')
        return reply.code(409).send({ error: 'Conflict', message: 'Room was dissolved' })
      }

      // Add replacement to team
      await client.query(
        'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
        [teamId, replacement.user_id]
      )

      // Remove from queue
      await client.query(
        'DELETE FROM matchmaking_queue WHERE user_id = $1',
        [replacement.user_id]
      )

      // Status stays active
      await client.query('COMMIT')
      return reply.send({ status: 'active', replacement_found: true, requeued: shouldRequeue })
    }

    // No replacement available — enter seeking_replacement
    await client.query(
      `UPDATE teams SET status = 'seeking_replacement', seeking_role = $1
       WHERE id = $2`,
      [leavingRole, teamId]
    )

    await client.query('COMMIT')
    return reply.send({
      status: 'seeking_replacement',
      seeking_role: leavingRole,
      requeued: shouldRequeue
    })

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
