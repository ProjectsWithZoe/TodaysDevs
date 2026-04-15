import { authenticate }     from '../../hooks/authenticate.js'
import { requireMember }    from '../../hooks/requireMember.js'
import { submitSchema, reviewSchema } from './schema.js'
import { submitProject }    from './submit.js'
import { getSubmission }    from './get.js'
import { reviewSubmission } from './review.js'

export default async function submissionRoutes(fastify) {
  fastify.addHook('onRequest', authenticate)

  // POST /submissions — any authenticated team member
  fastify.post('/', { schema: submitSchema }, submitProject)

  // GET /submissions/:teamId — must be a member of that team
  fastify.get('/:teamId', {
    preHandler: [
      // requireMember reads request.params.id — alias teamId → id temporarily
      async (req, rep) => {
        req.params.id = req.params.teamId
        return requireMember(req, rep)
      }
    ]
  }, getSubmission)

  // PATCH /submissions/:id — reviewer stub (any authenticated user for now)
  fastify.patch('/:id', { schema: reviewSchema }, reviewSubmission)
}
