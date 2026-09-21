export const APP_NAME = 'Sapiens Industrial'
export const APP_SHORT_NAME = 'Sapiens'
export const APP_TAGLINE = 'Gestión interna del proyecto'
export const DEFAULT_TIMEZONE = 'America/Argentina/Cordoba'
export const DEFAULT_LOCALE = 'es-AR'

export const APP_ROLES = {
  administrador: 'administrador',
  socio: 'socio',
  colaborador: 'colaborador',
  soloLectura: 'solo_lectura',
} as const

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES]

export const STAGE_STATUSES = {
  noIniciada: 'no_iniciada',
  planificada: 'planificada',
  enCurso: 'en_curso',
  bloqueada: 'bloqueada',
  completada: 'completada',
  pausada: 'pausada',
} as const

export type StageStatus = (typeof STAGE_STATUSES)[keyof typeof STAGE_STATUSES]

export const TASK_STATUSES = {
  pendiente: 'pendiente',
  enCurso: 'en_curso',
  bloqueada: 'bloqueada',
  finalizada: 'finalizada',
} as const

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES]

export const TASK_PRIORITIES = {
  baja: 'baja',
  media: 'media',
  alta: 'alta',
  critica: 'critica',
} as const

export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES]

export const MILESTONE_STATUSES = {
  pendiente: 'pendiente',
  alcanzado: 'alcanzado',
  cancelado: 'cancelado',
} as const

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[keyof typeof MILESTONE_STATUSES]
