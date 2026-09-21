import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { AuthContext, type AuthContextValue, type AuthStatus } from '@/features/auth/auth-context.ts'
import { isSupabaseConfigured, supabase } from '@/lib/supabase.ts'
import { fetchSessionProfile, signOut as signOutRequest } from '@/services/auth.ts'
import type { AppRole, ProfileRow } from '@/types/database.types.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'ready')
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)

  const refresh = useCallback(async () => {
    if (!configured) {
      setStatus('ready')
      return
    }

    const result = await fetchSessionProfile()
    setSession(result?.session ?? null)
    setUser(result?.user ?? null)
    setProfile(result?.profile ?? null)
    setRole(result?.role ?? null)
    setStatus('ready')
  }, [configured])

  const signOut = useCallback(async () => {
    if (!configured) {
      return
    }

    await signOutRequest()
    setSession(null)
    setUser(null)
    setProfile(null)
    setRole(null)
  }, [configured])

  useEffect(() => {
    void refresh()

    if (!supabase) {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [configured, refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      configured,
      session,
      user,
      profile,
      role,
      refresh,
      signOut,
    }),
    [configured, profile, refresh, role, session, signOut, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
