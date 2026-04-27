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
  const isProd = process.env.NODE_ENV === 'production'

const fastify = Fastify({
  logger: opts.logger ?? (
    isProd
      ? true
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              colorize: true
            }
          }
        }
  )
})

  

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
  'https://todaysdevs.com',
  'https://www.todaysdevs.com',
  'https://todaysdevs.co.uk',
  'https://www.todaysdevs.co.uk'
  ]

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)

      const cleanOrigin = origin.replace(/\/$/, '')

      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
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
