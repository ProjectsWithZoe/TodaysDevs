import { authenticate } from '../../hooks/authenticate.js'
import { posthog }      from '../../lib/posthog.js'

const patchRoleSchema = {
  body: {
    type: 'object',
    required: ['role'],
    additionalProperties: false,
    properties: {
      role: { type: 'string', enum: ['frontend', 'backend', 'fullstack'] }
    }
  }
}

const patchMeSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      display_name: { type: 'string', minLength: 2, maxLength: 50 }
    }
  }
}

export default async function userRoutes(fastify) {
  // GET /users/community — all users with their active projects
  fastify.get('/community', { preHandler: authenticate }, async (request, reply) => {
    const { rows } = await fastify.db.query(
      `SELECT
         u.id,
         COALESCE(u.display_name, split_part(u.email, '@', 1)) AS display_name,
         r.name        AS role,
         ROUND(u.lat::numeric, 1)  AS lat,
         ROUND(u.lng::numeric, 1)  AS lng,
         u.city,
         u.country,
         u.country_code,
         u.ua_browser,
         u.ua_device,
         u.last_seen_at,
         COALESCE(
           json_agg(
             json_build_object('title', t.project_title, 'mode', t.mode)
             ORDER BY t.created_at DESC
           ) FILTER (WHERE t.id IS NOT NULL AND t.status IN ('active','lobby')),
           '[]'
         ) AS active_projects
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN team_members tm ON tm.user_id = u.id
       LEFT JOIN teams t
         ON t.id = tm.team_id AND t.status IN ('active','lobby')
       WHERE u.last_seen_at >= CURRENT_DATE
       GROUP BY u.id, r.name
       ORDER BY u.last_seen_at DESC`
    )
    return reply.send(rows)
  })


  // GET /users/me
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { rows } = await fastify.db.query(
      `SELECT u.id, u.email, u.display_name, u.created_at, r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [request.user.sub]
    )
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Not Found', message: 'User not found' })
    }
    return reply.send(rows[0])
  })

  // PATCH /users/me/location — store geolocated coordinates
  fastify.patch('/me/location', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['lat', 'lng'],
        additionalProperties: false,
        properties: {
          lat:          { type: 'number',           minimum: -90,  maximum: 90  },
          lng:          { type: 'number',           minimum: -180, maximum: 180 },
          city:         { type: ['string', 'null'] },
          country:      { type: ['string', 'null'] },
          country_code: { type: ['string', 'null'], maxLength: 2 },
        },
      },
    },
  }, async (request, reply) => {
    const { lat, lng, city = null, country = null, country_code = null } = request.body
    await fastify.db.query(
      `UPDATE users
       SET lat = $1, lng = $2, city = $3, country = $4, country_code = $5
       WHERE id = $6`,
      [lat, lng, city, country, country_code, request.user.sub]
    )
    return reply.send({ lat, lng })
  })

  // PATCH /users/me — update display_name
  fastify.patch('/me', {
    preHandler: authenticate,
    schema: patchMeSchema
  }, async (request, reply) => {
    const { display_name } = request.body

    if (!display_name) {
      return reply.code(400).send({ error: 'Bad Request', message: 'display_name is required' })
    }

    const { rows } = await fastify.db.query(
      `UPDATE users SET display_name = $1 WHERE id = $2
       RETURNING id, email, display_name, created_at`,
      [display_name.trim(), request.user.sub]
    )

    posthog.capture({
      distinctId: request.user.sub,
      event: 'user_display_name_updated',
      properties: {},
    })

    return reply.send(rows[0])
  })

  // PATCH /users/me/role
  fastify.patch('/me/role', {
    preHandler: authenticate,
    schema: patchRoleSchema
  }, async (request, reply) => {
    const { role } = request.body

    const { rows } = await fastify.db.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    )
    if (rows.length === 0) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Invalid role' })
    }

    await fastify.db.query(
      'UPDATE users SET role_id = $1 WHERE id = $2',
      [rows[0].id, request.user.sub]
    )

    posthog.capture({
      distinctId: request.user.sub,
      event: 'user_role_updated',
      properties: { role },
    })

    return reply.send({ role })
  })
}
