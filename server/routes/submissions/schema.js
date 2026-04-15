export const submitSchema = {
  body: {
    type: 'object',
    required: ['team_id', 'repo_url'],
    properties: {
      team_id:  { type: 'string', format: 'uuid' },
      repo_url: { type: 'string', format: 'uri' },
      notes:    { type: 'string', maxLength: 500 }
    },
    additionalProperties: false
  }
}

export const reviewSchema = {
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status:   { type: 'string', enum: ['reviewed', 'accepted', 'rejected'] },
      feedback: { type: 'string' }
    },
    additionalProperties: false
  }
}
