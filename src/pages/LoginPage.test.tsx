import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthProvider.tsx'
import { LoginPage } from '@/pages/LoginPage.tsx'

vi.mock('@/lib/supabase.ts', () => ({
  isSupabaseConfigured: () => false,
  supabase: null,
  getSupabase: () => {
    throw new Error('Supabase no está configurado.')
  },
}))

describe('LoginPage', () => {
  it('explica que no hay registro público si falta Supabase', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByText(/no hay registro público/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeDisabled()
  })
})
