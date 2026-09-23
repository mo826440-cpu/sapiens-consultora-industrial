/**
 * Matriz esperada tras aplicar 20260921233000.
 * No sustituye una prueba de RLS contra PostgreSQL; documenta el contrato.
 */
export const SECURITY_DEFINER_FUNCTIONS = [
  'protect_profile_privileges',
  'handle_new_user',
  'is_active_user',
  'current_app_role',
  'is_admin',
  'is_staff',
  'can_write_project',
  'can_edit_task',
  'recalculate_stage_progress',
] as const

export const TRIGGER_FUNCTIONS = [
  'set_updated_at',
  'protect_profile_privileges',
  'handle_new_user',
] as const

export const POLICY_HELPER_FUNCTIONS = [
  'is_active_user',
  'current_app_role',
  'is_admin',
  'is_staff',
  'can_write_project',
  'can_edit_task',
  'recalculate_stage_progress',
] as const

export const ACTORS = [
  'anonimo',
  'inactivo',
  'solo_lectura',
  'colaborador',
  'socio',
  'administrador',
] as const

export type SecurityActor = (typeof ACTORS)[number]

export type RpcExpectation = {
  /** Puede invocar el RPC vía PostgREST / GRANT EXECUTE. */
  execute: boolean
  /** Si ejecuta, el resultado de escritura (solo aplica a recalculate). */
  writesProgress?: boolean
  /** Resultado booleano o nulo esperado cuando execute es true. */
  returns?: boolean | null
}

export type ActorPrivilegeRow = {
  actor: SecurityActor
  isActive: boolean
  role: 'administrador' | 'socio' | 'colaborador' | 'solo_lectura' | null
  helpers: {
    is_active_user: RpcExpectation
    current_app_role: RpcExpectation
    is_admin: RpcExpectation
    is_staff: RpcExpectation
    can_write_project: RpcExpectation
    can_edit_task: RpcExpectation
  }
  recalculate_stage_progress: RpcExpectation
  triggerRpcs: RpcExpectation
}

export const FUNCTION_PRIVILEGE_MATRIX: readonly ActorPrivilegeRow[] = [
  {
    actor: 'anonimo',
    isActive: false,
    role: null,
    helpers: {
      is_active_user: { execute: false },
      current_app_role: { execute: false },
      is_admin: { execute: false },
      is_staff: { execute: false },
      can_write_project: { execute: false },
      can_edit_task: { execute: false },
    },
    recalculate_stage_progress: { execute: false, writesProgress: false },
    triggerRpcs: { execute: false },
  },
  {
    actor: 'inactivo',
    isActive: false,
    role: 'colaborador',
    helpers: {
      is_active_user: { execute: true, returns: false },
      current_app_role: { execute: true, returns: null },
      is_admin: { execute: true, returns: false },
      is_staff: { execute: true, returns: false },
      can_write_project: { execute: true, returns: false },
      can_edit_task: { execute: true, returns: false },
    },
    recalculate_stage_progress: { execute: true, writesProgress: false },
    triggerRpcs: { execute: false },
  },
  {
    actor: 'solo_lectura',
    isActive: true,
    role: 'solo_lectura',
    helpers: {
      is_active_user: { execute: true, returns: true },
      current_app_role: { execute: true },
      is_admin: { execute: true, returns: false },
      is_staff: { execute: true, returns: false },
      can_write_project: { execute: true, returns: false },
      can_edit_task: { execute: true, returns: false },
    },
    recalculate_stage_progress: { execute: true, writesProgress: false },
    triggerRpcs: { execute: false },
  },
  {
    actor: 'colaborador',
    isActive: true,
    role: 'colaborador',
    helpers: {
      is_active_user: { execute: true, returns: true },
      current_app_role: { execute: true },
      is_admin: { execute: true, returns: false },
      is_staff: { execute: true, returns: false },
      can_write_project: { execute: true, returns: true },
      can_edit_task: { execute: true },
    },
    recalculate_stage_progress: { execute: true, writesProgress: true },
    triggerRpcs: { execute: false },
  },
  {
    actor: 'socio',
    isActive: true,
    role: 'socio',
    helpers: {
      is_active_user: { execute: true, returns: true },
      current_app_role: { execute: true },
      is_admin: { execute: true, returns: false },
      is_staff: { execute: true, returns: true },
      can_write_project: { execute: true, returns: true },
      can_edit_task: { execute: true, returns: true },
    },
    recalculate_stage_progress: { execute: true, writesProgress: true },
    triggerRpcs: { execute: false },
  },
  {
    actor: 'administrador',
    isActive: true,
    role: 'administrador',
    helpers: {
      is_active_user: { execute: true, returns: true },
      current_app_role: { execute: true },
      is_admin: { execute: true, returns: true },
      is_staff: { execute: true, returns: true },
      can_write_project: { execute: true, returns: true },
      can_edit_task: { execute: true, returns: true },
    },
    recalculate_stage_progress: { execute: true, writesProgress: true },
    triggerRpcs: { execute: false },
  },
]
