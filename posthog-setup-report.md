<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the **newdev** server-side Node.js application (Fastify). A singleton PostHog client was created and wired into all major business-critical routes. Exception capture was added to the global error handler. Graceful shutdown hooks ensure all queued events are flushed when the process exits.

## Changes summary

| File | Change |
|------|--------|
| `server/lib/posthog.js` | **New file** — PostHog singleton client using `POSTHOG_API_KEY` and `POSTHOG_HOST` env vars, with `enableExceptionAutocapture: true` |
| `server/server.js` | Added PostHog import and `SIGINT`/`SIGTERM` shutdown hooks to flush events on exit |
| `server/errorHandler.js` | Added `posthog.captureException()` for all 500+ errors, using the authenticated user's ID when available |
| `server/routes/rooms/create.js` | `room_created` event with `room_id`, `project_id`, `project_title`, `mode` |
| `server/routes/rooms/join.js` | `room_joined` event (both `/rooms/:id/join` and `/rooms/join-by-code`) with `room_id`, `project_id`, `mode`, `method` |
| `server/routes/rooms/start.js` | `room_started` event with `room_id`, `project_id`, `mode`, `member_count` |
| `server/routes/rooms/leave.js` | `room_left` event across all exit paths (dissolved, partner_left, replacement_found, seeking_replacement) with `room_id`, `project_id`, `mode`, `result`, `requeued` |
| `server/routes/matchmaking/queue.js` | `matchmaking_queue_joined` event when queued; `matchmaking_matched` event (per matched user) when a team is assembled; `matchmaking_queue_left` event when leaving queue |
| `server/routes/submissions/submit.js` | `project_submitted` event with `submission_id`, `team_id`, `project_id`, `repo_host` |
| `server/routes/submissions/review.js` | `submission_reviewed` event with `submission_id`, `team_id`, `status` (accepted/rejected) |
| `server/routes/users/index.js` | `user_display_name_updated` and `user_role_updated` events |
| `server/.env` | Added `POSTHOG_API_KEY` and `POSTHOG_HOST` environment variables |

## Events tracked

| Event | Description | File |
|-------|-------------|------|
| `room_created` | User creates a new coding room (solo mode) | `server/routes/rooms/create.js` |
| `room_joined` | User joins an existing room by ID or join code | `server/routes/rooms/join.js` |
| `room_started` | Room creator starts the coding session from lobby | `server/routes/rooms/start.js` |
| `room_left` | User leaves a room mid-session | `server/routes/rooms/leave.js` |
| `matchmaking_queue_joined` | User enters the matchmaking queue | `server/routes/matchmaking/queue.js` |
| `matchmaking_matched` | Matchmaking assembles a team and creates a room | `server/routes/matchmaking/queue.js` |
| `matchmaking_queue_left` | User voluntarily leaves the matchmaking queue | `server/routes/matchmaking/queue.js` |
| `project_submitted` | Team submits their project repo, completing the session | `server/routes/submissions/submit.js` |
| `submission_reviewed` | A reviewer accepts or rejects a team submission | `server/routes/submissions/review.js` |
| `user_role_updated` | User sets/changes their developer role | `server/routes/users/index.js` |
| `user_display_name_updated` | User updates their display name | `server/routes/users/index.js` |

## Next steps

We've suggested five insights for your **Analytics basics** dashboard — navigate to your PostHog project to create them:

- **Session funnel** (Funnel): `room_created` → `room_started` → `project_submitted` — tracks how many rooms make it all the way to submission
- **Submission acceptance rate** (Trend): `submission_reviewed` filtered by `status = accepted` vs `status = rejected` — key quality signal
- **Matchmaking conversion** (Funnel): `matchmaking_queue_joined` → `matchmaking_matched` — shows how effective matchmaking is
- **Room abandonment** (Trend): `room_left` — especially with `result = dissolved` — tracks churn from active sessions
- **User role distribution** (Bar chart): `user_role_updated` broken down by `role` property — understand your user mix

Dashboard link: https://us.posthog.com/project/392716/dashboard

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
