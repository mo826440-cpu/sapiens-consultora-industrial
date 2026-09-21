import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PROJECT_STAGES } from '@/config/stages.ts'
import { RoadmapPage } from '@/pages/RoadmapPage.tsx'
import { renderWithQuery } from '@/test/providers.tsx'

vi.mock('@/services/tracking.ts', () => ({
  fetchStages: () =>
    Promise.resolve({
      data: PROJECT_STAGES.map((stage) => ({
        id: `stage-${stage.order}`,
        slug: stage.slug,
        name: stage.name,
        sort_order: stage.order,
        status: 'no_iniciada',
        owner_id: null,
        planned_start: null,
        planned_end: null,
        progress_percent: 0,
        summary: null,
        created_at: '2026-09-20T00:00:00Z',
        updated_at: '2026-09-20T00:00:00Z',
        created_by: null,
        updated_by: null,
        profiles: null,
      })),
      error: null,
    }),
  fetchAllStageItems: () => Promise.resolve({ data: [], error: null }),
  fetchTasks: () => Promise.resolve({ data: [], error: null }),
}))

describe('RoadmapPage', () => {
  it('muestra las ocho etapas de la ruta', async () => {
    renderWithQuery(<RoadmapPage />)

    expect(screen.getByRole('heading', { name: 'De la idea al primer cliente' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Identidad y enfoque' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Primer cliente' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver detalle' })).toHaveLength(8)
  })
})
