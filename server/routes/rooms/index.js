import { authenticate }    from '../../hooks/authenticate.js'
import { requireMember }   from '../../hooks/requireMember.js'
import { createRoom }      from './create.js'
import { joinRoom, joinByCode } from './join.js'
import { startRoom }       from './start.js'
import { getRoomDetail }   from './detail.js'
import { myRooms }         from './mine.js'
import { leaveRoom }       from './leave.js'
import { partnerDecision } from './partnerDecision.js'
import {
  createBodySchema,
  joinByCodeBodySchema,
  leaveRoomBodySchema,
  roomParamsSchema,
  fullRoomResponse,
  myRoomsResponse
} from './schema.js'

const partnerDecisionBodySchema = {
  type: 'object',
  required: ['decision'],
  additionalProperties: false,
  properties: {
    decision: { type: 'string', enum: ['requeue', 'dissolve'] }
  }
}

export default async function roomsRoutes(fastify) {
  const auth       = { preHandler: authenticate }
  const authMember = { preHandler: [authenticate, requireMember] }

  // ── Static routes first (Fastify prefers them, but explicit is clearer) ──

  // GET /rooms/my — must be before /:id to avoid shadowing
  fastify.get('/my', {
    ...auth,
    schema: { response: myRoomsResponse }
  }, myRooms)

  // POST /rooms/join-by-code — static, no /:id conflict
  fastify.post('/join-by-code', {
    ...auth,
    schema: {
      body:     joinByCodeBodySchema,
      response: fullRoomResponse
    }
  }, joinByCode)

  // ── Create ────────────────────────────────────────────────────────────────

  fastify.post('/', {
    ...auth,
    schema: {
      body:     createBodySchema,
      response: { 201: fullRoomResponse[200] }
    }
  }, createRoom)

  // ── Parametric routes ─────────────────────────────────────────────────────

  // GET /rooms/:id
  fastify.get('/:id', {
    ...authMember,
    schema: {
      params:   roomParamsSchema,
      response: fullRoomResponse
    }
  }, getRoomDetail)

  // POST /rooms/:id/join
  fastify.post('/:id/join', {
    ...auth,
    schema: {
      params:   roomParamsSchema,
      response: fullRoomResponse
    }
  }, joinRoom)

  // POST /rooms/:id/start
  fastify.post('/:id/start', {
    ...authMember,
    schema: {
      params:   roomParamsSchema,
      response: fullRoomResponse
    }
  }, startRoom)

  // POST /rooms/:id/leave
  fastify.post('/:id/leave', {
    ...auth,
    schema: {
      params: roomParamsSchema,
      body: leaveRoomBodySchema
    }
  }, leaveRoom)

  // PATCH /rooms/:id/partner-decision
  fastify.patch('/:id/partner-decision', {
    ...auth,
    schema: {
      params: roomParamsSchema,
      body:   partnerDecisionBodySchema
    }
  }, partnerDecision)
}
