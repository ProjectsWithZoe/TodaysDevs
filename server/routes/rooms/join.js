import { CAPACITY } from '../../lib/constants.js'
import { fetchRoom } from './detail.js'
import { posthog }   from '../../lib/posthog.js'

/**
 * Shared membership-addition logic used by both join endpoints.
 * Validates lobby state, capacity, and uniqueness before inserting.
 */
async function addMember(db, team, userId, reply) {
  if (team.status !== 'lobby') {
    return reply.code(400).send({
      error: 'Bad Request',
      message: `Room is already ${team.status}`
    })
  }

  const capacity = CAPACITY[team.mode]
  if (team.members.length >= capacity) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: `Room is full (${capacity}/${capacity})`
    })
  }

  const alreadyMember = team.members.some(m => m.user_id === userId)
  if (alreadyMember) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'You are already a member of this room'
    })
  }

  await db.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
    [team.id, userId]
  )
  return null // null = no error
}

// POST /rooms/:id/join
export async function joinRoom(request, reply) {
  const { id }   = request.params
  const userId   = request.user.sub
  const db       = request.server.db

  const team = await fetchRoom(db, id)
  if (!team) {
    return reply.code(404).send({ error: 'Not Found', message: 'Room not found' })
  }

  const err = await addMember(db, team, userId, reply)
  if (err !== null) return

  posthog.capture({
    distinctId: userId,
    event: 'room_joined',
    properties: {
      room_id:    id,
      project_id: team.project_id,
      mode:       team.mode,
      method:     'direct',
    },
  })

  return reply.send(await fetchRoom(db, id))
}

// POST /rooms/join-by-code
export async function joinByCode(request, reply) {
  const { join_code } = request.body
  const userId        = request.user.sub
  const db            = request.server.db

  const { rows } = await db.query(
    'SELECT id FROM teams WHERE join_code = $1',
    [join_code.toUpperCase()]
  )
  if (rows.length === 0) {
    return reply.code(404).send({ error: 'Not Found', message: 'Invalid join code' })
  }

  const teamId = rows[0].id
  const team   = await fetchRoom(db, teamId)

  const err = await addMember(db, team, userId, reply)
  if (err !== null) return

  posthog.capture({
    distinctId: userId,
    event: 'room_joined',
    properties: {
      room_id:    teamId,
      project_id: team.project_id,
      mode:       team.mode,
      method:     'join_code',
    },
  })

  return reply.send(await fetchRoom(db, teamId))
}
