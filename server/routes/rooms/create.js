import { generateJoinCode } from '../../lib/joinCode.js'
import { fetchRoom }        from './detail.js'

export async function createRoom(request, reply) {
  const { project_id, mode } = request.body
  const userId = request.user.sub
  const db = request.server.db

  // Validate project exists and mode matches project.type
  const { rows: projectRows } = await db.query(
    'SELECT id, type FROM projects WHERE id = $1',
    [project_id]
  )
  if (projectRows.length === 0) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found' })
  }
  if (projectRows[0].type !== mode) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: `This project requires mode "${projectRows[0].type}", not "${mode}"`
    })
  }

  // Prevent direct room creation for collaborative modes
  if (mode !== 'solo') {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'Collaborative projects must use matchmaking queue'
    })
  }

  // Solo rooms are immediately active (skip lobby)
  const status    = mode === 'solo' ? 'active' : 'lobby'
  const join_code = generateJoinCode()

  const { rows: [team] } = await db.query(
    `INSERT INTO teams (project_id, created_by, mode, status, join_code)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [project_id, userId, mode, status, join_code]
  )

  // Add creator as first member
  await db.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
    [team.id, userId]
  )

  const room = await fetchRoom(db, team.id)
  return reply.code(201).send(room)
}
