import fp from 'fastify-plugin'
import { makePool } from '../lib/pgPool.js'

export default fp(async function db(fastify) {
  const pool = makePool({ connectionTimeoutMillis: 10000 }) // 10 second timeout

  // Verify connection on startup
  const client = await pool.connect()
  client.release()

  fastify.decorate('db', pool)

  fastify.addHook('onClose', async () => {
    await pool.end()
  })
}, { name: 'db' })
