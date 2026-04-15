import { MIN_TO_START } from '../../lib/constants.js'
import { fetchRoom }    from './detail.js'

export async function startRoom(request, reply) {
  const { id } = request.params
  const userId = request.user.sub
  const db     = request.server.db

  // requireMember already confirmed the user is in this room;
  // now fetch the full room to run business-rule checks
  const team = await fetchRoom(db, id)
  if (!team) {
    return reply.code(404).send({ error: 'Not Found', message: 'Room not found' })
  }

  if (team.created_by !== userId) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Only the room creator can start the session'
    })
  }

  if (team.status !== 'lobby') {
    return reply.code(400).send({
      error: 'Bad Request',
      message: `Room is already ${team.status}`
    })
  }

  const min = MIN_TO_START[team.mode]
  if (team.members.length < min) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: `Need at least ${min} member${min !== 1 ? 's' : ''} to start (have ${team.members.length})`
    })
  }

  await db.query(
    "UPDATE teams SET status = 'active' WHERE id = $1",
    [id]
  )

  return reply.send(await fetchRoom(db, id))
}
