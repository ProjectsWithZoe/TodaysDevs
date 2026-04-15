import { MESSAGE_TYPES } from '../../ws/messageTypes.js'

const ALLOWED_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org'])

export async function submitProject(request, reply) {
  const { team_id, repo_url, notes } = request.body
  const userId = request.user.sub
  const db     = request.server.db

  // Validate repo_url hostname
  let parsedUrl
  try {
    parsedUrl = new URL(repo_url)
  } catch {
    return reply.code(400).send({ error: 'Bad Request', message: 'Invalid repo_url' })
  }
  if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    return reply.code(400).send({
      error:   'Bad Request',
      message: `repo_url must be from one of: ${[...ALLOWED_HOSTS].join(', ')}`
    })
  }

  // Verify user is a team member
  const { rows: memberRows } = await db.query(
    'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
    [team_id, userId]
  )
  if (memberRows.length === 0) {
    return reply.code(403).send({ error: 'Forbidden', message: 'Not a member of this team' })
  }

  // Fetch team to verify status and get project_id
  const { rows: [team] } = await db.query(
    'SELECT id, project_id, status FROM teams WHERE id = $1',
    [team_id]
  )
  if (!team) {
    return reply.code(404).send({ error: 'Not Found', message: 'Team not found' })
  }
  if (team.status !== 'active') {
    return reply.code(400).send({
      error:   'Bad Request',
      message: team.status === 'completed'
        ? 'This team has already submitted'
        : 'Team is not active — cannot submit'
    })
  }

  // Get submitter display name for WS broadcast
  const { rows: [submitter] } = await db.query(
    'SELECT email FROM users WHERE id = $1',
    [userId]
  )

  // Transaction: insert submission + mark team completed atomically
  const client = await db.connect()
  let submission
  try {
    await client.query('BEGIN')

    const { rows: [sub] } = await client.query(
      `INSERT INTO submissions (team_id, project_id, submitted_by, repo_url, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [team_id, team.project_id, userId, repo_url, notes ?? null]
    )
    submission = sub

    await client.query(
      'UPDATE teams SET status = $1 WHERE id = $2',
      ['completed', team_id]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    // Unique violation on team_id — already submitted
    if (err.code === '23505') {
      return reply.code(409).send({
        error:   'Conflict',
        message: 'This team has already submitted'
      })
    }
    throw err
  } finally {
    client.release()
  }

  // Broadcast to all connected room members (fire-and-forget)
  request.server.chatManager?.broadcast(team_id, {
    type:      MESSAGE_TYPES.PROJECT_SUBMITTED,
    payload:   {
      submittedBy: submitter?.email ?? 'A teammate',
      submittedAt: submission.submitted_at
    },
    userId:    userId,
    timestamp: new Date().toISOString()
  })

  return reply.code(201).send(submission)
}
