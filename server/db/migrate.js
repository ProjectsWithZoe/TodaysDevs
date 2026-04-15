import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { makePool } from '../lib/pgPool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pool = makePool()

const migrationsDir = join(__dirname, 'migrations')
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  process.stdout.write(`Running migration: ${file} ... `)
  await pool.query(sql)
  console.log('done')
}

await pool.end()
console.log('All migrations complete.')
