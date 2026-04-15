/**
 * Requires that the authenticated user is a member of the team referenced
 * by request.params.id. Must run after authenticate.
 */
export async function requireMember(request, _reply) {
  const { rows } = await request.server.db.query(
    'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
    [request.params.id, request.user.sub]
  )
  if (rows.length === 0) {
    const err = new Error('Not a member of this room')
    err.statusCode = 403
    throw err
  }
}
