/**
 * requireRole returns a preHandler that must run after authenticate.
 * Usage: preHandler: [authenticate, requireRole(['backend', 'fullstack'])]
 */
export function requireRole(roles) {
  return async function (request, reply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' })
    }
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient role' })
    }
  }
}
