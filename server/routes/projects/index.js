import { authenticate } from '../../hooks/authenticate.js'
import { listProjects } from './list.js'
import { getProject }   from './detail.js'
import {
  listQuerySchema,
  listResponseSchema,
  detailParamsSchema,
  detailResponseSchema
} from './schema.js'

export default async function projectsRoutes(fastify) {
  // GET /projects
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      querystring: listQuerySchema,
      response:    listResponseSchema
    }
  }, listProjects)

  // GET /projects/:id
  fastify.get('/:id', {
    preHandler: authenticate,
    schema: {
      params:   detailParamsSchema,
      response: detailResponseSchema
    }
  }, getProject)
}
