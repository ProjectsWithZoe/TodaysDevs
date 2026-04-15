export const joinQueueSchema = {
  body: {
    type: 'object',
    required: ['project_id', 'mode'],
    properties: {
      project_id: { type: 'string', format: 'uuid' },
      mode:       { type: 'string', enum: ['duo', 'team'] }
    },
    additionalProperties: false
  }
}
