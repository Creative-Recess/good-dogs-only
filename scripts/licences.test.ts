import { describe, expect, it } from 'vitest'
import { isAllowedLicence } from './lib/licences.ts'

describe('isAllowedLicence', () => {
  it.each(['CC BY-SA 4.0', 'CC BY 2.0', 'CC BY-SA 3.0 de', 'CC0', 'Public domain', 'PD-self'])('accepts %s', (l) => {
    expect(isAllowedLicence(l)).toBe(true)
  })

  it.each(['GPL', 'GFDL', 'FAL', 'Copyrighted free use', 'CC BY-NC 2.0', 'CC BY-ND 4.0', '', undefined])('rejects %s', (l) => {
    expect(isAllowedLicence(l)).toBe(false)
  })
})
