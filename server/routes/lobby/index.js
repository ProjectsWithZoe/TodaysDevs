/**
 * GET /lobby/:project_id?mode=duo|team
 *
 * Returns the public view of the matchmaking queue for a project+mode.
 * Requires authentication (any signed-in user).
 * Exposes only: display_name, role, wait_seconds — no PII.
 */
import { authenticate } from '../../hooks/authenticate.js'

const querySchema = {
  type: 'object',
  required: ['mode'],
  properties: {
    mode: { type: 'string', enum: ['duo', 'team'] }
  }
}

const responseSchema = {
  200: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        display_name:  { type: ['string', 'null'] },
        role:          { type: ['string', 'null'] },
        wait_seconds:  { type: 'integer' }
      }
    }
  }
}

export default async function lobbyRoutes(fastify) {
  fastify.get('/:project_id', {
    preHandler: authenticate,
    schema: {
      querystring: querySchema,
      response:    responseSchema
    }
  }, async function getLobby(request, reply) {
    const { project_id } = request.params
    const { mode }       = request.query
    const { db }         = request.server

    const { rows } = await db.query(
      `SELECT
         COALESCE(u.display_name, u.email) AS display_name,
         r.name                            AS role,
         EXTRACT(EPOCH FROM (NOW() - mq.queued_at))::int AS wait_seconds
       FROM matchmaking_queue mq
       LEFT JOIN users u ON u.id = mq.user_id
       LEFT JOIN roles r ON r.id = mq.role_id
       WHERE mq.project_id = $1
         AND mq.mode       = $2
       ORDER BY mq.queued_at ASC`,
      [project_id, mode]
    )

    return reply.send(rows)
  })
}
