/**
 * Unit tests for findRoleReplacement in matchmaker.js
 * Run with: node --test services/matchmaker.test.js
 */
import { describe, it }  from 'node:test'
import assert             from 'node:assert/strict'
import { findRoleReplacement } from './matchmaker.js'

const PROJECT = 'aaaaaaaa-0000-0000-0000-000000000000'

function entry(id, role, secsAgo = 60) {
  return {
    user_id:    id,
    project_id: PROJECT,
    mode:       'team',
    role_id:    null,
    role,
    experience_level: 1,
    queued_at: new Date(Date.now() - secsAgo * 1000).toISOString()
  }
}

describe('findRoleReplacement', () => {
  // ── frontend left ─────────────────────────────────────────────────────────

  it('frontend left: accepts frontend replacement', () => {
    const q = [entry(1, 'frontend')]
    const result = findRoleReplacement('frontend', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  it('frontend left: accepts fullstack replacement', () => {
    const q = [entry(1, 'fullstack')]
    const result = findRoleReplacement('frontend', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  it('frontend left: rejects backend replacement', () => {
    const q = [entry(1, 'backend')]
    const result = findRoleReplacement('frontend', q, PROJECT)
    assert.equal(result, null)
  })

  // ── backend left ──────────────────────────────────────────────────────────

  it('backend left: accepts backend replacement', () => {
    const q = [entry(1, 'backend')]
    const result = findRoleReplacement('backend', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  it('backend left: accepts fullstack replacement', () => {
    const q = [entry(1, 'fullstack')]
    const result = findRoleReplacement('backend', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  it('backend left: rejects frontend replacement', () => {
    const q = [entry(1, 'frontend')]
    const result = findRoleReplacement('backend', q, PROJECT)
    assert.equal(result, null)
  })

  // ── fullstack left ────────────────────────────────────────────────────────

  it('fullstack left: accepts frontend replacement', () => {
    const q = [entry(1, 'frontend')]
    const result = findRoleReplacement('fullstack', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  it('fullstack left: accepts backend replacement', () => {
    const q = [entry(1, 'backend')]
    const result = findRoleReplacement('fullstack', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  it('fullstack left: accepts fullstack replacement', () => {
    const q = [entry(1, 'fullstack')]
    const result = findRoleReplacement('fullstack', q, PROJECT)
    assert.equal(result?.user_id, 1)
  })

  // ── FCFS ─────────────────────────────────────────────────────────────────

  it('FCFS: returns oldest compatible entry among many', () => {
    const q = [
      entry(1, 'backend', 30),   // joined 30s ago (newer)
      entry(2, 'backend', 120),  // joined 120s ago (oldest)
      entry(3, 'backend', 60),
    ]
    const result = findRoleReplacement('backend', q, PROJECT)
    assert.equal(result?.user_id, 2)
  })

  it('FCFS: prefers fullstack over newer fullstack', () => {
    const q = [
      entry(1, 'fullstack', 10),
      entry(2, 'fullstack', 200),
    ]
    const result = findRoleReplacement('backend', q, PROJECT)
    assert.equal(result?.user_id, 2)
  })

  // ── project_id filtering ─────────────────────────────────────────────────

  it('filters to the specified project_id only', () => {
    const other = 'bbbbbbbb-0000-0000-0000-000000000000'
    const q = [
      { ...entry(1, 'backend', 60), project_id: other }, // different project
      entry(2, 'backend', 30),                            // correct project
    ]
    const result = findRoleReplacement('backend', q, PROJECT)
    assert.equal(result?.user_id, 2)
  })

  // ── null cases ────────────────────────────────────────────────────────────

  it('returns null when queue is empty', () => {
    assert.equal(findRoleReplacement('frontend', [], PROJECT), null)
  })

  it('returns null when no compatible candidate exists', () => {
    const q = [entry(1, 'frontend')]
    assert.equal(findRoleReplacement('backend', q, PROJECT), null)
  })
})
