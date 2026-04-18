// ── Request schemas ──────────────────────────────────────────────────────────

export const createBodySchema = {
  type: 'object',
  required: ['project_id'],
  additionalProperties: false,
  properties: {
    project_id: { type: 'string', minLength: 1 },
    repo:       { type: 'string' },
  }
}

export const joinByCodeBodySchema = {
  type: 'object',
  required: ['join_code'],
  additionalProperties: false,
  properties: {
    join_code: { type: 'string', minLength: 1, maxLength: 10 }
  }
}

export const roomParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } }
}

export const leaveRoomBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    requeue: { type: 'boolean' }
  }
}

// ── Shared response shapes ────────────────────────────────────────────────────

const memberShape = {
  type: 'object',
  properties: {
    user_id:      { type: 'integer' },
    display_name: { type: 'string' },
    role:         { type: ['string', 'null'] },
    joined_at:    { type: 'string' }
  }
}

const projectSummaryShape = {
  type: 'object',
  properties: {
    title: { type: 'string' }
  }
}

export const fullRoomShape = {
  type: 'object',
  properties: {
    id:               { type: 'string' },
    project_id:       { type: 'string' },
    created_by:       { type: 'integer' },
    mode:             { type: 'string' },
    status:           { type: 'string' },
    join_code:        { type: 'string' },
    created_at:       { type: 'string' },
    partner_left_at:  { type: ['string', 'null'] },
    seeking_role:     { type: ['string', 'null'] },
    project:          projectSummaryShape,
    members:          { type: 'array', items: memberShape }
  }
}

export const myRoomShape = {
  type: 'object',
  properties: {
    id:            { type: 'string' },
    project_id:    { type: 'string' },
    project_title: { type: 'string' },
    mode:          { type: 'string' },
    status:        { type: 'string' },
    join_code:     { type: 'string' },
    member_count:  { type: 'integer' },
    created_at:    { type: 'string' }
  }
}

// ── Response schemas ──────────────────────────────────────────────────────────

export const fullRoomResponse   = { 200: fullRoomShape }
export const myRoomsResponse    = { 200: { type: 'array', items: myRoomShape } }
