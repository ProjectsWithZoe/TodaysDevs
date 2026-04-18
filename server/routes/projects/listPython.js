import { listGithubProjectsFromRepo } from '../../services/github.js'

/**
 * GET /projects/python
 * Returns all project folders from TodaysDevs/python-projects, enriched with html_url.
 */
export async function listPythonProjects(request, reply) {
  const db = request.server.db

  let projects
  try {
    projects = await listGithubProjectsFromRepo('python-projects')
  } catch (err) {
    request.log.error(err, 'Failed to fetch Python projects from GitHub')
    return reply.code(502).send({ error: 'Bad Gateway', message: 'Could not reach GitHub' })
  }

  // Enrich with active_count from DB (same as the HTML list)
  const slugs = projects.map(p => p.slug)
  let activeCounts = {}

  if (slugs.length > 0) {
    const { rows } = await db.query(
      `SELECT t.project_id::text, COUNT(DISTINCT tm.user_id)::int AS active_count
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE t.status = 'active' AND t.project_id::text = ANY($1)
       GROUP BY t.project_id`,
      [slugs]
    )
    activeCounts = Object.fromEntries(rows.map(r => [r.project_id, r.active_count]))
  }

  const data = projects.map(p => ({
    id:           p.slug,
    title:        p.title,
    description:  p.description,
    html_url:     p.html_url,
    repo:         'python-projects',
    active_count: activeCounts[p.slug] ?? 0,
  }))

  return reply.send({ data, total: data.length })
}
