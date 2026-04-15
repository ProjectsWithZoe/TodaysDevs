import { toNodeHandler } from 'better-auth/node'
import { auth } from '../../lib/auth.js'

const handler = toNodeHandler(auth)

// CORS headers set by @fastify/cors land on the Fastify `reply` object.
// reply.hijack() bypasses Fastify's send pipeline, so those headers never
// reach reply.raw.  Copy them across manually before hijacking.
const CORS_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'vary',
]

// No fp() wrapper — keeps addContentTypeParser scoped to auth routes only,
// so the global JSON parser for all other routes is left untouched.
export default async function authRoutes(fastify) {
  // Pass the raw stream straight through — do NOT use parseAs:'buffer'.
  // With parseAs:'buffer' Fastify consumes the IncomingMessage stream before
  // BA ever sees it, leaving request.raw empty and body undefined.
  fastify.addContentTypeParser(
    ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'multipart/form-data'],
    (_req, payload, done) => done(null, payload)
  )

  fastify.route({
    url:    '/api/auth/*',
    method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    handler(request, reply) {
      for (const h of CORS_HEADERS) {
        const val = reply.getHeader(h)
        if (val !== undefined) reply.raw.setHeader(h, val)
      }
      handler(request.raw, reply.raw)
      return reply.hijack()
    },
  })
}
