import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import type { AppRole, ProfileRow } from '@/types/database.types.ts'

export type AuthStatus = 'loading' | 'ready'

export type AuthContextValue = {
  status: AuthStatus
  configured: boolean
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  role: AppRole | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
