import 'dotenv/config'
import { buildApp } from './app.js'
import { posthog } from './lib/posthog.js'

const start = async()=>{
  try {
    const app = await buildApp({ logger: true })

await app.listen({
  port: Number(process.env.PORT ?? 3001),
  host: '0.0.0.0'
})

console.log(`Server running on port ${process.env.PORT}`)
  } catch (err){
    console.error('Server failed to start')
    process.exit(1)

  }
}

start()

process.on('SIGINT', async () => {
  await posthog.shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await posthog.shutdown()
  process.exit(0)
})
