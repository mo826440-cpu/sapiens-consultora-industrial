import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from '@/pages/HomePage.tsx'
import { renderWithQuery } from '@/test/providers.tsx'

vi.mock('@/services/tracking.ts', () => ({
  fetchStages: () => Promise.resolve({ data: [], error: null }),
  fetchTaskCounts: () => Promise.resolve({ data: [], error: null }),
  fetchProgressUpdates: () => Promise.resolve({ data: [], error: null }),
}))

describe('HomePage', () => {
  it('explica que no hay datos simulados', async () => {
    renderWithQuery(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Seguimiento del proyecto' })).toBeInTheDocument()
    expect(screen.getByText(/no se muestran datos simulados/i)).toBeInTheDocument()
    expect(await screen.findByText(/todavía no hay avances registrados/i)).toBeInTheDocument()
  })
})
