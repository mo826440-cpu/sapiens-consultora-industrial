import { describe, expect, it } from 'vitest'

import { taskSchema } from '@/schemas/tracking.ts'

describe('taskSchema', () => {
  it('rechaza una fecha límite anterior al inicio', () => {
    const result = taskSchema.safeParse({
      title: 'Armar demo',
      stage_id: '11111111-1111-1111-1111-111111111111',
      priority: 'media',
      status: 'pendiente',
      start_date: '2026-09-20',
      due_date: '2026-09-01',
      progress_percent: 10,
      assignee_ids: [],
      depends_on_ids: [],
    })

    expect(result.success).toBe(false)
  })

  it('acepta una tarea mínima válida', () => {
    const result = taskSchema.safeParse({
      title: 'Armar demo',
      stage_id: '11111111-1111-1111-1111-111111111111',
      priority: 'alta',
      status: 'en_curso',
      progress_percent: 20,
      assignee_ids: [],
      depends_on_ids: [],
    })

    expect(result.success).toBe(true)
  })
})
