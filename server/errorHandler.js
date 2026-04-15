export function errorHandler(error, _request, reply) {
  // JSON Schema validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: error.message
    })
  }

  // @fastify/rate-limit errors carry statusCode 429
  const statusCode = error.statusCode ?? 500

  if (statusCode >= 500) {
    reply.log.error(error)
  }

  reply.code(statusCode).send({
    error: error.name ?? 'Internal Server Error',
    message: statusCode >= 500 ? 'Internal Server Error' : (error.message ?? 'An error occurred')
  })
}
