import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import dbPlugin from './plugins/db.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import authRoutes         from './routes/auth/index.js'
import userRoutes         from './routes/users/index.js'
import projectRoutes      from './routes/projects/index.js'
import roomRoutes         from './routes/rooms/index.js'
import matchmakingRoutes  from './routes/matchmaking/index.js'
import submissionRoutes   from './routes/submissions/index.js'
import leaderboardRoutes  from './routes/leaderboard/index.js'
import lobbyRoutes        from './routes/lobby/index.js'
import healthRoutes from './routes/health/index.js'
import { errorHandler } from './errorHandler.js'

export async function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: opts.logger ?? true
  })

  await fastify.register(cors, {
    origin:      process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })

  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET,
  })

  await fastify.register(dbPlugin)
  await fastify.register(rateLimitPlugin)

  fastify.setErrorHandler(errorHandler)

  // Auth routes must be registered before protected routes
  await fastify.register(authRoutes)
  await fastify.register(healthRoutes)

  await fastify.register(userRoutes,        { prefix: '/users' })
  await fastify.register(projectRoutes,     { prefix: '/projects' })
  await fastify.register(roomRoutes,        { prefix: '/rooms' })
  await fastify.register(matchmakingRoutes, { prefix: '/matchmaking' })
  await fastify.register(submissionRoutes,  { prefix: '/submissions' })
  await fastify.register(leaderboardRoutes, { prefix: '/leaderboard' })
  await fastify.register(lobbyRoutes,       { prefix: '/lobby' })

  return fastify
}
