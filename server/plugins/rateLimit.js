import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export default fp(async function rateLimitPlugin(fastify) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry after ${context.after}`
    })
  })
}, { name: 'rateLimit' })
