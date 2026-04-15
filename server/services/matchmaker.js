/**
 * Pure matchmaking functions — no DB calls, fully unit-testable.
 *
 * Each queue entry shape expected:
 *   { user_id: number, project_id: string, mode: 'duo'|'team',
 *     role_id: number|null, role: string|null,
 *     experience_level: 1|2|3, queued_at: Date|string }
 */

const FRONTEND_ROLES  = ['frontend']
const BACKEND_ROLES   = ['backend']
const FULLSTACK_ROLES = ['fullstack']

/** Returns true when the two roles can work together as a duo/team. */
export function isRoleCompatible(roleA, roleB) {
  const a = roleA?.toLowerCase() ?? null
  const b = roleB?.toLowerCase() ?? null

  // Two pure frontends or two pure backends — not compatible
  if (FRONTEND_ROLES.includes(a) && FRONTEND_ROLES.includes(b)) return false
  if (BACKEND_ROLES.includes(a)  && BACKEND_ROLES.includes(b))  return false

  return true
}

/**
 * Returns true when the two experience levels are close enough to pair.
 * Normal mode: |diff| <= 1.  Relaxed mode (waiting > 60s): always true.
 */
export function isExperienceCompatible(levelA, levelB, relaxed = false) {
  if (relaxed) return true
  return Math.abs(levelA - levelB) <= 1
}

/** Returns true when the candidate has been waiting more than 60 seconds. */
export function shouldRelaxConstraints(queuedAt) {
  const waitMs = Date.now() - new Date(queuedAt).getTime()
  return waitMs > 60_000
}

/**
 * Returns a set of "user_id-user_id" strings (low-high order) representing
 * pairs that have already worked together on this project.
 */
function buildPairSet(pairingHistory, projectId) {
  const set = new Set()
  for (const row of pairingHistory) {
    if (row.project_id === projectId) {
      const key = `${Math.min(row.user_a, row.user_b)}-${Math.max(row.user_a, row.user_b)}`
      set.add(key)
    }
  }
  return set
}

function pairKey(a, b) {
  return `${Math.min(a, b)}-${Math.max(a, b)}`
}

/**
 * Finds the best duo partner for `candidate` from `otherEntries`.
 *
 * Priority:
 *   1. Role compatible
 *   2. Experience compatible (relaxed if candidate waited > 60s)
 *   3. Not previously paired on this project
 *   4. Oldest queued_at (longest wait wins)
 *
 * Returns the matching entry or null.
 */
export function findDuoMatch(candidate, otherEntries, pairingHistory) {
  const relaxed = shouldRelaxConstraints(candidate.queued_at)
  const paired  = buildPairSet(pairingHistory, candidate.project_id)

  // Filter to same project + mode
  const pool = otherEntries.filter(e =>
    e.user_id    !== candidate.user_id &&
    e.project_id === candidate.project_id &&
    e.mode       === candidate.mode
  )

  // Score: role compat + experience compat + not previously paired
  const eligible = pool.filter(e =>
    isRoleCompatible(candidate.role, e.role) &&
    isExperienceCompatible(candidate.experience_level, e.experience_level, relaxed) &&
    !paired.has(pairKey(candidate.user_id, e.user_id))
  )

  if (eligible.length === 0) {
    // Second pass: drop previously-paired constraint if relaxed
    if (relaxed) {
      const fallback = pool.filter(e =>
        isRoleCompatible(candidate.role, e.role) &&
        isExperienceCompatible(candidate.experience_level, e.experience_level, true)
      )
      if (fallback.length === 0) return null
      return fallback.reduce((oldest, e) =>
        new Date(e.queued_at) < new Date(oldest.queued_at) ? e : oldest
      )
    }
    return null
  }

  // Return oldest waiting eligible entry
  return eligible.reduce((oldest, e) =>
    new Date(e.queued_at) < new Date(oldest.queued_at) ? e : oldest
  )
}

/**
 * Finds the best role-compatible replacement from the queue for a team slot that
 * was vacated by someone whose role was `leavingRole`.
 *
 * Compatibility:
 *   frontend  left → accept frontend | fullstack
 *   backend   left → accept backend  | fullstack
 *   fullstack left → accept frontend | backend | fullstack (any)
 *
 * Selection: oldest queued_at among compatible candidates for the same project (FCFS).
 * Returns the matching queue entry or null.
 *
 * @param {string}   leavingRole   - 'frontend' | 'backend' | 'fullstack'
 * @param {Array}    queueEntries  - entries from matchmaking_queue (shape per file header)
 * @param {string}   projectId     - project UUID; filters to same project
 */
export function findRoleReplacement(leavingRole, queueEntries, projectId) {
  const leaving = leavingRole?.toLowerCase() ?? null

  // Determine which roles are acceptable as replacements
  let acceptedRoles
  if (FRONTEND_ROLES.includes(leaving)) {
    acceptedRoles = [...FRONTEND_ROLES, ...FULLSTACK_ROLES]
  } else if (BACKEND_ROLES.includes(leaving)) {
    acceptedRoles = [...BACKEND_ROLES, ...FULLSTACK_ROLES]
  } else {
    // fullstack or unknown — accept anyone
    acceptedRoles = [...FRONTEND_ROLES, ...BACKEND_ROLES, ...FULLSTACK_ROLES]
  }

  const compatible = queueEntries.filter(e =>
    e.project_id === projectId &&
    acceptedRoles.includes(e.role?.toLowerCase() ?? '')
  )

  if (compatible.length === 0) return null

  // FCFS: oldest queued_at wins
  return compatible.reduce((oldest, e) =>
    new Date(e.queued_at) < new Date(oldest.queued_at) ? e : oldest
  )
}

/**
 * Attempts to assemble a team of 3–6 from `entries` (all same project + mode='team').
 *
 * Balance requirement: at least one frontend/fullstack AND at least one backend/fullstack.
 *
 * Returns an array of user_ids (3–6 entries) or null if assembly is impossible.
 */
export function assembleTeam(entries) {
  if (entries.length < 3) return null

  const hasFrontendish = entries.some(e =>
    FRONTEND_ROLES.includes(e.role?.toLowerCase()) ||
    FULLSTACK_ROLES.includes(e.role?.toLowerCase())
  )
  const hasBackendish = entries.some(e =>
    BACKEND_ROLES.includes(e.role?.toLowerCase()) ||
    FULLSTACK_ROLES.includes(e.role?.toLowerCase())
  )

  if (!hasFrontendish || !hasBackendish) return null

  // Take up to 6, oldest first
  const sorted = [...entries].sort(
    (a, b) => new Date(a.queued_at) - new Date(b.queued_at)
  )

  return sorted.slice(0, 6).map(e => e.user_id)
}
