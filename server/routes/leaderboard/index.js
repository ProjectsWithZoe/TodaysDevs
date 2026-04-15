import { authenticate }       from '../../hooks/authenticate.js'
import { listSchema }          from './schema.js'
import { listLeaderboard }     from './list.js'
import { getMyLeaderboard }    from './me.js'

export default async function leaderboardRoutes(fastify) {
  fastify.addHook('onRequest', authenticate)

  // GET /leaderboard/me — static route registered BEFORE parametric
  fastify.get('/me', getMyLeaderboard)

  // GET /leaderboard?type=global&role=frontend&limit=20&offset=0
  fastify.get('/', { schema: listSchema }, listLeaderboard)
}
