import { authenticate }           from '../../hooks/authenticate.js'
import { joinQueueSchema }         from './schema.js'
import { joinQueue, leaveQueue }   from './queue.js'
import { getStatus }               from './status.js'

export default async function matchmakingRoutes(fastify) {
  fastify.addHook('onRequest', authenticate)

  fastify.post('/queue',  { schema: joinQueueSchema }, joinQueue)
  fastify.delete('/queue', leaveQueue)
  fastify.get('/status',  getStatus)
}
