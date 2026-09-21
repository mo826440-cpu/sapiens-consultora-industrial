import { describe, expect, it } from 'vitest'

import { formatDateAR, formatDateTimeAR } from '@/lib/dates.ts'

describe('formatDateAR', () => {
  it('formatea una fecha en formato argentino', () => {
    expect(formatDateAR('2026-09-19')).toBe('19/09/2026')
  })

  it('devuelve un guion cuando no hay valor', () => {
    expect(formatDateAR(null)).toBe('—')
  })
})

describe('formatDateTimeAR', () => {
  it('incluye hora cuando la fecha es válida', () => {
    expect(formatDateTimeAR('2026-09-19T14:30:00')).toMatch(/19\/09\/2026/)
  })
})
