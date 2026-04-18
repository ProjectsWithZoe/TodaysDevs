// ── GET /projects ─────────────────────────────────────────────────────────────

export const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    difficulty: { type: 'string', enum: ['junior', 'mid', 'senior'] }
  }
}

const projectSummary = {
  type: 'object',
  properties: {
    id:           { type: 'string' },
    title:        { type: 'string' },
    description:  { type: ['string', 'null'] },
    active_count: { type: 'integer' },
  }
}

export const listResponseSchema = {
  200: {
    type: 'object',
    properties: {
      data:  { type: 'array', items: projectSummary },
      total: { type: 'integer' },
    }
  }
}

// ── GET /projects/:slug ───────────────────────────────────────────────────────

export const detailQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    repo: { type: 'string' }
  }
}

export const detailParamsSchema = {
  type: 'object',
  required: ['slug'],
  properties: {
    slug: { type: 'string', minLength: 1 }
  }
}

export const detailResponseSchema = {
  200: {
    type: 'object',
    properties: {
      id:           { type: 'string' },
      title:        { type: 'string' },
      description:  { type: ['string', 'null'] },
      active_count: { type: 'integer' },
    }
  }
}
