import { generateJoinCode }  from '../../lib/joinCode.js'
import { getGithubProject }  from '../../services/github.js'
import { fetchRoom }         from './detail.js'

export async function createRoom(request, reply) {
  const { project_id } = request.body   // GitHub folder slug
  const userId = request.user.sub
  const db = request.server.db

  // Verify the project exists on GitHub and get its title
  let project
  try {
    project = await getGithubProject(project_id)
  } catch {
    return reply.code(502).send({ error: 'Bad Gateway', message: 'Could not reach GitHub' })
  }
  if (!project) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found' })
  }

  // Prevent duplicate active rooms for the same project
  const { rows: existing } = await db.query(
    `SELECT id FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = $1 AND t.project_id = $2 AND t.status = 'active'`,
    [userId, project_id]
  )
  if (existing.length > 0) {
    return reply.code(409).send({
      error:   'Conflict',
      message: 'You already have an active session for this project',
      room_id: existing[0].id,
    })
  }

  const join_code = generateJoinCode()

  const { rows: [team] } = await db.query(
    `INSERT INTO teams (project_id, project_title, created_by, mode, status, join_code)
     VALUES ($1, $2, $3, 'solo', 'active', $4)
     RETURNING id`,
    [project_id, project.title, userId, join_code]
  )

  await db.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
    [team.id, userId]
  )

  const room = await fetchRoom(db, team.id)
  return reply.code(201).send(room)
}
