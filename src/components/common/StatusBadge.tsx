import { STAGE_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/config/labels.ts'
import type { StageStatus, TaskPriority, TaskStatus } from '@/config/constants.ts'

const STATUS_CLASS: Record<StageStatus, string> = {
  no_iniciada: 'text-bg-secondary',
  planificada: 'text-bg-info',
  en_curso: 'text-bg-primary',
  bloqueada: 'text-bg-danger',
  completada: 'text-bg-success',
  pausada: 'text-bg-warning',
}

const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  pendiente: 'text-bg-secondary',
  en_curso: 'text-bg-primary',
  bloqueada: 'text-bg-danger',
  finalizada: 'text-bg-success',
}

const TASK_PRIORITY_CLASS: Record<TaskPriority, string> = {
  baja: 'text-bg-light',
  media: 'text-bg-info',
  alta: 'text-bg-warning',
  critica: 'text-bg-danger',
}

export function StatusBadge({ status }: { status: StageStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STAGE_STATUS_LABELS[status]}</span>
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge ${TASK_STATUS_CLASS[status]}`}>{TASK_STATUS_LABELS[status]}</span>
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`badge ${TASK_PRIORITY_CLASS[priority]}`}>{TASK_PRIORITY_LABELS[priority]}</span>
  )
}
