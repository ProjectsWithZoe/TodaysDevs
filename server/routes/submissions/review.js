import { updateScore } from '../../services/scoring.js'
import { posthog }     from '../../lib/posthog.js'

// Terminal states — no further transitions allowed
const TERMINAL = new Set(['accepted', 'rejected'])

export async function reviewSubmission(request, reply) {
  const { id } = request.params
  const { status: newStatus, feedback } = request.body
  const userId = request.user.sub
  const db     = request.server.db

  // Fetch current submission (need team_id for score update if accepted)
  const { rows: [submission] } = await db.query(
    'SELECT id, status, team_id FROM submissions WHERE id = $1',
    [id]
  )
  if (!submission) {
    return reply.code(404).send({ error: 'Not Found', message: 'Submission not found' })
  }

  // Block backward transitions from terminal states
  if (TERMINAL.has(submission.status)) {
    return reply.code(400).send({
      error:   'Bad Request',
      message: `Cannot transition from '${submission.status}' — this submission is finalised`
    })
  }

  const { rows: [updated] } = await db.query(
    `UPDATE submissions
     SET status      = $1,
         reviewed_at = NOW(),
         reviewed_by = $2,
         notes       = COALESCE($3, notes)
     WHERE id = $4
     RETURNING *`,
    [newStatus, userId, feedback ?? null, id]
  )

  // On acceptance: recompute scores for all team members (fire-and-forget per member)
  if (newStatus === 'accepted') {
    const { rows: members } = await db.query(
      'SELECT user_id FROM team_members WHERE team_id = $1',
      [submission.team_id]
    )
    // Run updates concurrently; individual failures must not break the response
    Promise.all(
      members.map(m => updateScore(m.user_id, db).catch(err => {
        request.log.error({ err, userId: m.user_id }, 'updateScore failed')
      }))
    ).catch(() => {})
  }

  posthog.capture({
    distinctId: userId,
    event: 'submission_reviewed',
    properties: {
      submission_id: id,
      team_id:       submission.team_id,
      status:        newStatus,
    },
  })

  return reply.send(updated)
}
