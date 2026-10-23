import { describe, expect, it } from 'vitest'
import { browserOf, platformOf } from './platform.ts'

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

describe('browserOf', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)'
  it('tells Safari from the other iPhone browsers', () => {
    expect(browserOf(`${iphone} Version/27.0 Mobile/15E148 Safari/604.1`, 'ios')).toBe('safari')
    expect(browserOf(`${iphone} CriOS/141.0 Mobile/15E148 Safari/604.1`, 'ios')).toBe('ios-other')
    expect(browserOf(`${iphone} FxiOS/145.0 Mobile/15E148 Safari/605.1.15`, 'ios')).toBe('ios-other')
  })
  it("spots an app's own browser, which can't add to the Home Screen", () => {
    expect(browserOf(`${iphone} Mobile/15E148 Instagram 400.0.0`, 'ios')).toBe('in-app')
    expect(browserOf(`${iphone} Mobile/15E148 [FBAN/FBIOS;FBAV/500.0]`, 'ios')).toBe('in-app')
    expect(browserOf(`${iphone} Mobile/15E148`, 'ios')).toBe('in-app') // no Safari/ at all: a plain web view
    expect(browserOf('Mozilla/5.0 (Linux; Android 15; Pixel 9; wv) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36', 'android')).toBe('in-app')
  })
  it('treats Chrome on Android as a browser', () => {
    expect(browserOf('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36', 'android')).toBe('browser')
  })
})
