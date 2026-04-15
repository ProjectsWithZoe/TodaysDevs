/**
 * Idempotent project seed.
 * Projects are upserted by fixed UUID; child rows are deleted and re-inserted
 * inside a transaction so re-runs always reflect the current JSON.
 *
 * Run: node db/seeds/seed.js
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projects = JSON.parse(
  readFileSync(join(__dirname, 'projects.json'), 'utf8')
)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const client = await pool.connect()

// Build role name → id map
const { rows: roleRows } = await client.query('SELECT id, name FROM roles')
if (roleRows.length === 0) {
  console.error('No roles found — run `npm run seed` (roles seed) first.')
  process.exit(1)
}
const roleMap = Object.fromEntries(roleRows.map(r => [r.name, r.id]))

for (const project of projects) {
  await client.query('BEGIN')

  try {
    // Upsert project
    await client.query(
      `INSERT INTO projects (id, title, description, difficulty, type, difficulty_weight)
       VALUES ($1, $2, $3, $4::project_difficulty, $5::project_type, $6)
       ON CONFLICT (id) DO UPDATE SET
         title             = EXCLUDED.title,
         description       = EXCLUDED.description,
         difficulty        = EXCLUDED.difficulty,
         type              = EXCLUDED.type,
         difficulty_weight = EXCLUDED.difficulty_weight`,
      [project.id, project.title, project.description,
       project.difficulty, project.type, project.difficulty_weight]
    )

    // Requirements — delete + re-insert
    await client.query('DELETE FROM project_requirements WHERE project_id = $1', [project.id])
    for (const req of project.requirements) {
      await client.query(
        `INSERT INTO project_requirements (project_id, type, body, sort_order)
         VALUES ($1, $2::requirement_type, $3, $4)`,
        [project.id, req.type, req.body, req.sort_order]
      )
    }

    // Responsibilities — delete + re-insert
    await client.query(
      'DELETE FROM project_role_responsibilities WHERE project_id = $1',
      [project.id]
    )
    for (const resp of project.responsibilities) {
      const roleId = roleMap[resp.role]
      if (!roleId) {
        throw new Error(`Unknown role "${resp.role}" in project "${project.title}"`)
      }
      await client.query(
        `INSERT INTO project_role_responsibilities (project_id, role_id, responsibilities)
         VALUES ($1, $2, $3)`,
        [project.id, roleId, resp.items]
      )
    }

    // Resources — delete + re-insert
    await client.query('DELETE FROM project_resources WHERE project_id = $1', [project.id])
    for (const res of project.resources) {
      const roleId = res.role ? roleMap[res.role] : null
      if (res.role && !roleId) {
        throw new Error(`Unknown role "${res.role}" in resources for project "${project.title}"`)
      }
      await client.query(
        `INSERT INTO project_resources (project_id, role_id, label, url)
         VALUES ($1, $2, $3, $4)`,
        [project.id, roleId, res.label, res.url]
      )
    }

    // Steps — delete + re-insert
    await client.query('DELETE FROM project_steps WHERE project_id = $1', [project.id])
    for (const s of (project.steps ?? [])) {
      await client.query(
        `INSERT INTO project_steps (project_id, step, role, title, body)
         VALUES ($1, $2, $3, $4, $5)`,
        [project.id, s.step, s.role ?? null, s.title, s.body]
      )
    }

    await client.query('COMMIT')
    console.log(`Seeded: ${project.title}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(`Failed: ${project.title} —`, err.message)
    throw err
  }
}

client.release()
await pool.end()
console.log('Project seeding complete.')
