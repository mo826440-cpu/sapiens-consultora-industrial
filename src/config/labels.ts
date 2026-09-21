import {
  MILESTONE_STATUSES,
  STAGE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type MilestoneStatus,
  type StageStatus,
  type TaskPriority,
  type TaskStatus,
} from '@/config/constants.ts'

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  [STAGE_STATUSES.noIniciada]: 'No iniciada',
  [STAGE_STATUSES.planificada]: 'Planificada',
  [STAGE_STATUSES.enCurso]: 'En curso',
  [STAGE_STATUSES.bloqueada]: 'Bloqueada',
  [STAGE_STATUSES.completada]: 'Completada',
  [STAGE_STATUSES.pausada]: 'Pausada',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUSES.pendiente]: 'Pendiente',
  [TASK_STATUSES.enCurso]: 'En curso',
  [TASK_STATUSES.bloqueada]: 'Bloqueada',
  [TASK_STATUSES.finalizada]: 'Finalizada',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITIES.baja]: 'Baja',
  [TASK_PRIORITIES.media]: 'Media',
  [TASK_PRIORITIES.alta]: 'Alta',
  [TASK_PRIORITIES.critica]: 'Crítica',
}

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  [MILESTONE_STATUSES.pendiente]: 'Pendiente',
  [MILESTONE_STATUSES.alcanzado]: 'Alcanzado',
  [MILESTONE_STATUSES.cancelado]: 'Cancelado',
}
