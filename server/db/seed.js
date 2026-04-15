import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

for (const name of ['frontend', 'backend', 'fullstack']) {
  await pool.query(
    'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    [name]
  )
  console.log(`Seeded role: ${name}`)
}

await pool.end()
console.log('Seeding complete.')
