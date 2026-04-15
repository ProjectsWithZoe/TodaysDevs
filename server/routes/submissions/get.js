export async function getSubmission(request, reply) {
  const { teamId } = request.params
  const db = request.server.db

  const { rows: [submission] } = await db.query(
    `SELECT s.*,
            u_sub.email  AS submitted_by_name,
            u_rev.email  AS reviewed_by_name
     FROM submissions s
     JOIN users u_sub ON u_sub.id = s.submitted_by
     LEFT JOIN users u_rev ON u_rev.id = s.reviewed_by
     WHERE s.team_id = $1`,
    [teamId]
  )

  if (!submission) {
    return reply.code(404).send({ error: 'Not Found', message: 'No submission for this team' })
  }

  return reply.send(submission)
}
