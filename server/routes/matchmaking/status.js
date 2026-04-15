/**
 * GET /matchmaking/status
 *
 * Returns the user's current queue status:
 *   - not_queued  — not in queue
 *   - queued      — waiting; includes position and total in queue for that mode+project
 *   - matched     — a room was already created; includes room_id
 */
export async function getStatus(request, reply) {
  const userId = request.user.sub
  const db     = request.server.db

  // Check if user has an active room that was created via matchmaking
  // (status = active, user is a member, created very recently — within the polling window)
  // Simpler: just check the queue first; if not there, check for a recently-active room.

  const { rows: [entry] } = await db.query(
    `SELECT mq.id, mq.project_id, mq.mode, mq.queued_at
     FROM matchmaking_queue mq
     WHERE mq.user_id = $1`,
    [userId]
  )

  if (!entry) {
    // Check for a room that was just matched (active, member, within last 30s)
    const { rows: [room] } = await db.query(
      `SELECT t.id AS room_id
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
         AND t.status = 'active'
         AND t.created_at > NOW() - INTERVAL '10 minutes'
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [userId]
    )

    if (room) {
      return reply.send({ status: 'matched', room_id: room.room_id })
    }

    return reply.send({ status: 'not_queued' })
  }

  // Count position (1-indexed: how many were queued before this user for same project+mode)
  const { rows: [pos] } = await db.query(
    `SELECT COUNT(*)::int AS position
     FROM matchmaking_queue
     WHERE project_id = $1 AND mode = $2 AND queued_at < $3`,
    [entry.project_id, entry.mode, entry.queued_at]
  )

  const { rows: [tot] } = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM matchmaking_queue
     WHERE project_id = $1 AND mode = $2`,
    [entry.project_id, entry.mode]
  )

  return reply.send({
    status:     'queued',
    project_id: entry.project_id,
    mode:       entry.mode,
    queued_at:  entry.queued_at,
    position:   (pos.position ?? 0) + 1,
    total:      tot.total ?? 1
  })
}
