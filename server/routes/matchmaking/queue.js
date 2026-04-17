import { getExperienceLevel }          from '../../services/experienceLevel.js'
import { findDuoMatch, assembleTeam }  from '../../services/matchmaker.js'
import { generateJoinCode }            from '../../lib/joinCode.js'
import { CAPACITY }                    from '../../lib/constants.js'
import { getGithubProject }            from '../../services/github.js'

// ── POST /matchmaking/queue ─────────────────────────────────────────────────
export async function joinQueue(request, reply) {
  const { project_id, mode } = request.body
  const userId = request.user.sub
  const roleId = request.user.roleId ?? null
  const role   = request.user.role   ?? null
  const db     = request.server.db

  // Verify project exists on GitHub
  let project
  try {
    project = await getGithubProject(project_id)
  } catch {
    return reply.code(502).send({ error: 'Bad Gateway', message: 'Could not reach GitHub' })
  }
  if (!project) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found' })
  }

  const experienceLevel = await getExperienceLevel(db, userId)

  // --- BEGIN TRANSACTION (SELECT FOR UPDATE prevents race conditions) ---
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Upsert queue entry (UNIQUE on user_id enforces one active entry)
    await client.query(
      `INSERT INTO matchmaking_queue
         (user_id, project_id, mode, role_id, experience_level)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         project_id       = EXCLUDED.project_id,
         mode             = EXCLUDED.mode,
         role_id          = EXCLUDED.role_id,
         experience_level = EXCLUDED.experience_level,
         queued_at        = NOW()`,
      [userId, project_id, mode, roleId, experienceLevel]
    )

    // Read all queue entries for this project+mode, locking them
    const { rows: queueEntries } = await client.query(
      `SELECT mq.id, mq.user_id, mq.project_id, mq.mode,
              mq.role_id, mq.experience_level, mq.queued_at,
              r.name AS role
       FROM matchmaking_queue mq
       LEFT JOIN roles r ON r.id = mq.role_id
       WHERE mq.project_id = $1 AND mq.mode = $2
       ORDER BY mq.queued_at ASC
       FOR UPDATE OF mq`,
      [project_id, mode]
    )

    let matchedUserIds = null

    if (mode === 'duo') {
      const candidate  = queueEntries.find(e => e.user_id === userId)
      const others     = queueEntries.filter(e => e.user_id !== userId)
      const partner    = findDuoMatch(candidate, others, [])
      if (partner) matchedUserIds = [userId, partner.user_id]
    } else {
      // team
      const matched = assembleTeam(queueEntries)
      if (matched) matchedUserIds = matched
    }

    if (matchedUserIds) {
      // Create the room
      const joinCode = generateJoinCode()
      const { rows: [room] } = await client.query(
        `INSERT INTO teams (project_id, project_title, created_by, mode, status, join_code)
         VALUES ($1, $2, $3, $4, 'active', $5)
         RETURNING id`,
        [project_id, project.title, userId, mode, joinCode]
      )

      // Add all matched users as team members
      for (const uid of matchedUserIds) {
        await client.query(
          'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
          [room.id, uid]
        )
      }

      // Remove matched users from queue
      await client.query(
        'DELETE FROM matchmaking_queue WHERE user_id = ANY($1)',
        [matchedUserIds]
      )

      await client.query('COMMIT')
      return reply.code(201).send({ status: 'matched', room_id: room.id })
    }

    await client.query('COMMIT')
    return reply.code(202).send({ status: 'queued' })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── DELETE /matchmaking/queue ───────────────────────────────────────────────
export async function leaveQueue(request, reply) {
  const userId = request.user.sub
  const { rowCount } = await request.server.db.query(
    'DELETE FROM matchmaking_queue WHERE user_id = $1',
    [userId]
  )
  if (rowCount === 0) {
    return reply.code(404).send({ error: 'Not Found', message: 'Not in queue' })
  }
  return reply.code(204).send()
}
