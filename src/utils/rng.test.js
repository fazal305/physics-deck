import { describe, expect, it } from 'vitest'
import { createRng, shuffle } from './rng.js'

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces values in [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('shuffle preserves all elements', () => {
    const rng = createRng(1)
    const list = [1, 2, 3, 4, 5]
    const shuffled = shuffle(rng, list)
    expect(shuffled.sort()).toEqual(list.sort())
    expect(shuffled).not.toBe(list)
  })
})
