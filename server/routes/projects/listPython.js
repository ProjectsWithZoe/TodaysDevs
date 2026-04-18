import { listGithubProjectsFromRepo } from '../../services/github.js'

/**
 * GET /projects/python
 * Returns all project folders from TodaysDevs/python-projects, enriched with html_url.
 */
export async function listPythonProjects(request, reply) {
  let projects
  try {
    projects = await listGithubProjectsFromRepo('python-projects')
  } catch (err) {
    request.log.error(err, 'Failed to fetch Python projects from GitHub')
    return reply.code(502).send({ error: 'Bad Gateway', message: 'Could not reach GitHub' })
  }

  const data = projects.map(p => ({
    id:          p.slug,
    title:       p.title,
    description: p.description,
    html_url:    p.html_url,
  }))

  return reply.send({ data, total: data.length })
}
