import { APP_ROLES, type AppRole } from '@/config/constants.ts'

export const ROLE_LABELS: Record<AppRole, string> = {
  [APP_ROLES.administrador]: 'Administrador',
  [APP_ROLES.socio]: 'Socio',
  [APP_ROLES.colaborador]: 'Colaborador',
  [APP_ROLES.soloLectura]: 'Solo lectura',
}

export function hasRole(role: AppRole | null, allowed: readonly AppRole[]): boolean {
  return role !== null && allowed.includes(role)
}

export function isStaffRole(role: AppRole | null): boolean {
  return hasRole(role, [APP_ROLES.administrador, APP_ROLES.socio])
}

export function isAdminRole(role: AppRole | null): boolean {
  return hasRole(role, [APP_ROLES.administrador])
}

export function canWriteProject(role: AppRole | null): boolean {
  return hasRole(role, [APP_ROLES.administrador, APP_ROLES.socio, APP_ROLES.colaborador])
}

export function canEditTask(
  role: AppRole | null,
  userId: string | undefined,
  task: { owner_id: string | null; created_by: string | null },
  assigneeIds: string[] = [],
): boolean {
  if (!userId) {
    return false
  }

  if (isStaffRole(role)) {
    return true
  }

  if (!canWriteProject(role)) {
    return false
  }

  return task.owner_id === userId || task.created_by === userId || assigneeIds.includes(userId)
}
