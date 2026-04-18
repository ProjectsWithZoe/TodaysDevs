import { getGithubProject } from '../../services/github.js'

/**
 * GET /projects/:slug
 * Returns project metadata from GitHub + live active_count from DB.
 */
export async function getProject(request, reply) {
  const { slug } = request.params
  const { repo }  = request.query
  const db = request.server.db

  // 1. Fetch from GitHub (cached)
  const project = await getGithubProject(slug, repo || undefined)
  if (!project) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found' })
  }

  // 2. Active count from DB
  const { rows } = await db.query(
    `SELECT COUNT(DISTINCT tm.user_id)::int AS active_count
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE t.project_id = $1 AND t.status = 'active'`,
    [slug]
  )

  return reply.send({
    id:           project.slug,
    title:        project.title,
    description:  project.description,
    active_count: rows[0]?.active_count ?? 0,
    repo:         project.repo,
  })
}
