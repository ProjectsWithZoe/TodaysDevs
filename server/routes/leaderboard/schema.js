export const listSchema = {
  querystring: {
    type: 'object',
    properties: {
      type:   { type: 'string', enum: ['solo', 'duo', 'team', 'global'], default: 'global' },
      role:   { type: 'string', enum: ['frontend', 'backend', 'fullstack'] },
      limit:  { type: 'integer', minimum: 1,  maximum: 100, default: 20 },
      offset: { type: 'integer', minimum: 0,               default: 0  }
    },
    additionalProperties: false
  }
}
