import { listGithubProjects } from '../../services/github.js'

/**
 * GET /projects
 * Returns all projects from the GitHub repo, enriched with live active_count from DB.
 */
export async function listProjects(request, reply) {
  const { difficulty } = request.query
  const db = request.server.db

  // 1. Fetch project metadata from GitHub (cached)
  let projects = await listGithubProjects()

  // Filter by difficulty if provided (reads from project.json if the field is there)
  if (difficulty) {
    projects = projects.filter(p => p.difficulty === difficulty)
  }

  // 2. Get active_count per project from DB in one query
  const slugs = projects.map(p => p.slug)
  let activeCounts = {}

  if (slugs.length > 0) {
    const { rows } = await db.query(
      `SELECT project_id, COUNT(DISTINCT tm.user_id)::int AS active_count
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE t.status = 'active' AND t.project_id = ANY($1)
       GROUP BY t.project_id`,
      [slugs]
    )
    activeCounts = Object.fromEntries(rows.map(r => [r.project_id, r.active_count]))
  }

  // 3. Merge
  const data = projects.map(p => ({
    id:           p.slug,
    title:        p.title,
    description:  p.description,
    active_count: activeCounts[p.slug] ?? 0,
  }))

  return reply.send({ data, total: data.length })
}
