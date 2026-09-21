import type { Session, User } from '@supabase/supabase-js'

import { getSupabase } from '@/lib/supabase.ts'
import type { AppRole, ProfileRow } from '@/types/database.types.ts'

export type SessionProfile = {
  user: User
  session: Session
  profile: ProfileRow | null
  role: AppRole | null
}

type RoleAssignment = {
  roles: {
    code: AppRole
    name: string
  } | null
}

type ProfileWithRole = ProfileRow & {
  user_roles: RoleAssignment[] | RoleAssignment | null
}

function readRole(row: ProfileWithRole | null): AppRole | null {
  if (!row?.user_roles) {
    return null
  }

  const assignment = Array.isArray(row.user_roles) ? row.user_roles[0] : row.user_roles
  return assignment?.roles?.code ?? null
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut()
  return { error }
}

export async function requestPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/actualizar-contrasena`
  const { data, error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo })
  return { data, error }
}

export async function updatePassword(password: string) {
  const { data, error } = await getSupabase().auth.updateUser({ password })
  return { data, error }
}

export async function fetchSessionProfile(): Promise<SessionProfile | null> {
  const client = getSupabase()
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession()

  if (sessionError || !session?.user) {
    return null
  }

  const { data, error } = await client
    .from('profiles')
    .select('*, user_roles!user_id ( roles ( code, name ) )')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    return {
      user: session.user,
      session,
      profile: null,
      role: null,
    }
  }

  const row = data as ProfileWithRole | null
  const role = readRole(row)

  return {
    user: session.user,
    session,
    profile: row,
    role,
  }
}

export async function updateOwnProfile(values: {
  full_name: string
  job_title?: string
  phone?: string
}) {
  const client = getSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('No hay una sesión activa.') }
  }

  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: values.full_name,
      job_title: values.job_title || null,
      phone: values.phone || null,
    })
    .eq('id', user.id)
    .select()
    .single()

  return { data, error }
}

export async function fetchTeamMembers() {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, full_name, job_title, is_active, user_roles!user_id ( id, role_id, roles ( code, name ) )')
    .order('full_name')

  return { data, error }
}

export async function fetchRoles() {
  const { data, error } = await getSupabase().from('roles').select('id, code, name, description').order('name')
  return { data, error }
}

export async function assignUserRole(userId: string, roleId: string, createdBy: string) {
  const client = getSupabase()
  const { data: existing, error: existingError } = await client
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    return { error: existingError }
  }

  if (existing) {
    const { error } = await client
      .from('user_roles')
      .update({ role_id: roleId, created_by: createdBy })
      .eq('id', existing.id)
    return { error }
  }

  const { error } = await client.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
    created_by: createdBy,
  })

  return { error }
}
