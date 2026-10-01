import { describe, expect, it } from 'vitest'
import picksFile from '../data/photo-picks.json' with { type: 'json' }

const ALLOWED = new Set(['file', 'external', 'focus', 'by', 'confidence', 'note', 'previous'])

describe('data/photo-picks.json', () => {
  it('only uses the fields the build understands', () => {
    for (const [id, pick] of Object.entries(picksFile.picks)) {
      for (const key of Object.keys(pick)) expect(ALLOWED, `${id}: ${key}`).toContain(key)
      expect(['claude-review', 'claude', 'justin'], id).toContain(pick.by)
      expect(pick.file || ('external' in pick && pick.external), `${id} has no photo`).toBeTruthy()
    }
  })
})
