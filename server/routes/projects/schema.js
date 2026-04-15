// ── Shared field definitions ────────────────────────────────────────────────

const projectSummaryProps = {
  id:                   { type: 'string' },
  title:                { type: 'string' },
  description:          { type: ['string', 'null'] },
  difficulty:           { type: 'string', enum: ['junior', 'mid', 'senior'] },
  type:                 { type: 'string', enum: ['solo', 'duo', 'team'] },
  created_at:           { type: 'string' },
  responsibilities_count: { type: 'integer' },
  // Activity counts
  active_count:    { type: 'integer' },
  lobby_count:     { type: 'integer' },
  // Role breakdown — only populated for duo/team projects
  frontend_count:  { type: 'integer' },
  backend_count:   { type: 'integer' },
  fullstack_count: { type: 'integer' }
  // difficulty_weight intentionally omitted → Fastify strips it via response schema
}

// ── GET /projects ────────────────────────────────────────────────────────────

export const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    difficulty: { type: 'string', enum: ['junior', 'mid', 'senior'] },
    type:       { type: 'string', enum: ['solo', 'duo', 'team'] },
    limit:      { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    offset:     { type: 'integer', minimum: 0, default: 0 }
  }
}

export const listResponseSchema = {
  200: {
    type: 'object',
    properties: {
      data:   { type: 'array', items: { type: 'object', properties: projectSummaryProps } },
      total:  { type: 'integer' },
      limit:  { type: 'integer' },
      offset: { type: 'integer' }
    }
  }
}

// ── GET /projects/:id ────────────────────────────────────────────────────────

export const detailParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' }
  }
}

export const detailResponseSchema = {
  200: {
    type: 'object',
    properties: {
      id:               { type: 'string' },
      title:            { type: 'string' },
      description:      { type: ['string', 'null'] },
      difficulty:       { type: 'string', enum: ['junior', 'mid', 'senior'] },
      type:             { type: 'string', enum: ['solo', 'duo', 'team'] },
      created_at:       { type: 'string' },
      // difficulty_weight omitted
      requirements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id:         { type: 'string' },
            type:       { type: 'string', enum: ['functional', 'non-functional'] },
            body:       { type: 'string' },
            sort_order: { type: 'integer' }
          }
        }
      },
      responsibilities: {
        type: 'array',
        items: { type: 'string' }
      },
      resources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id:      { type: 'string' },
            label:   { type: 'string' },
            url:     { type: 'string' },
            role_id: { type: ['integer', 'null'] }
          }
        }
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id:    { type: 'string' },
            step:  { type: 'integer' },
            role:  { type: ['string', 'null'] },
            title: { type: 'string' },
            body:  { type: 'string' }
          }
        }
      },
      // Activity counts
      active_count:    { type: 'integer' },
      lobby_count:     { type: 'integer' },
      // Role breakdown — only populated for duo/team projects
      frontend_count:  { type: 'integer' },
      backend_count:   { type: 'integer' },
      fullstack_count: { type: 'integer' }
    }
  }
}
