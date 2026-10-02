import { describe, expect, it } from 'vitest'
import { platformOf } from './platform.ts'

describe('platformOf', () => {
  it('spots iPhones and iPads, including iPads asking for the desktop site', () => {
    expect(platformOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15', 5)).toBe('ios')
    expect(platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 5)).toBe('ios')
  })
  it('spots Android, and treats a Mac or PC as other', () => {
    expect(platformOf('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36', 5)).toBe('android')
    expect(platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 0)).toBe('other')
  })
})
