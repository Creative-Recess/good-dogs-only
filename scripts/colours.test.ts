import { describe, expect, it } from 'vitest'
import { pickColours } from './lib/colours.ts'
import type { Rgb } from '../src/data/types.ts'

const many = (c: Rgb, n: number) => Array.from({ length: n }, () => c)

describe('pickColours', () => {
  it('takes the most common colour as the body and a clearly different one as the patch', () => {
    const { body, patch } = pickColours([...many([200, 140, 60], 50), ...many([250, 250, 245], 20), ...many([205, 145, 62], 5)])
    expect(body).toEqual([200, 140, 60]) // averaged with the near-identical [205, 145, 62]
    expect(patch).toEqual([250, 250, 245])
  })

  it('ignores grass and sky', () => {
    const { body } = pickColours([...many([60, 160, 50], 80), ...many([120, 170, 230], 80), ...many([30, 30, 30], 10)])
    expect(body).toEqual([30, 30, 30])
  })

  it('lightens the body for the patch when the dog is one colour', () => {
    expect(pickColours(many([100, 80, 60], 30)).patch).toEqual([135, 108, 81])
  })

  it('falls back to a tan dog when nothing is left', () => {
    expect(pickColours(many([60, 160, 50], 10)).body).toEqual([170, 120, 70])
  })
})
