import { authenticate }     from '../../hooks/authenticate.js'
import { listProjects }    from './list.js'
import { getProject }      from './detail.js'
import { downloadProject } from './download.js'
import {
  listQuerySchema,
  listResponseSchema,
  detailParamsSchema,
  detailResponseSchema,
} from './schema.js'

export default async function projectsRoutes(fastify) {
  // GET /projects
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      querystring: listQuerySchema,
      response:    listResponseSchema,
    }
  }, listProjects)

  // GET /projects/:slug
  fastify.get('/:slug', {
    preHandler: authenticate,
    schema: {
      params:   detailParamsSchema,
      response: detailResponseSchema,
    }
  }, getProject)

  // GET /projects/:slug/download — returns a ZIP of the project folder
  fastify.get('/:slug/download', {
    preHandler: authenticate,
  }, downloadProject)
}
