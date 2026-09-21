import { describe, expect, it } from 'vitest'

import { isTaskOverdue, parseTags, wouldCreateCycle } from '@/utils/tracking.ts'

describe('parseTags', () => {
  it('separa y recorta etiquetas', () => {
    expect(parseTags(' demo, caso , ')).toEqual(['demo', 'caso'])
  })
})

describe('isTaskOverdue', () => {
  it('marca vencida si no está finalizada y la fecha ya pasó', () => {
    expect(isTaskOverdue('pendiente', '2026-01-01', '2026-09-20')).toBe(true)
    expect(isTaskOverdue('finalizada', '2026-01-01', '2026-09-20')).toBe(false)
  })
})

describe('wouldCreateCycle', () => {
  it('detecta un ciclo A → B → A', () => {
    expect(
      wouldCreateCycle('a', ['b'], [{ task_id: 'b', depends_on_task_id: 'a' }]),
    ).toBe(true)
  })

  it('acepta una dependencia acíclica', () => {
    expect(
      wouldCreateCycle('a', ['b'], [{ task_id: 'c', depends_on_task_id: 'b' }]),
    ).toBe(false)
  })
})
