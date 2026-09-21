import { z } from 'zod'

import {
  MILESTONE_STATUSES,
  STAGE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@/config/constants.ts'

const optionalDate = z.string().optional().or(z.literal(''))
const optionalText = z.string().trim().optional()

export const taskSchema = z
  .object({
    title: z.string().trim().min(2, 'Ingresá un título.').max(180),
    description: optionalText,
    stage_id: z.string().uuid('Elegí una etapa.'),
    category: optionalText,
    priority: z.enum([
      TASK_PRIORITIES.baja,
      TASK_PRIORITIES.media,
      TASK_PRIORITIES.alta,
      TASK_PRIORITIES.critica,
    ]),
    status: z.enum([
      TASK_STATUSES.pendiente,
      TASK_STATUSES.enCurso,
      TASK_STATUSES.bloqueada,
      TASK_STATUSES.finalizada,
    ]),
    owner_id: z.string().uuid().optional().or(z.literal('')),
    start_date: optionalDate,
    due_date: optionalDate,
    progress_percent: z.coerce.number().min(0).max(100),
    notes: optionalText,
    tags: optionalText,
    assignee_ids: z.array(z.string().uuid()),
    depends_on_ids: z.array(z.string().uuid()),
  })
  .refine(
    (values) => !values.start_date || !values.due_date || values.due_date >= values.start_date,
    { message: 'La fecha límite no puede ser anterior al inicio.', path: ['due_date'] },
  )

export const taskCommentSchema = z.object({
  body: z.string().trim().min(1, 'Escribí un comentario.').max(4000),
})

export const stageMetaSchema = z.object({
  status: z.enum([
    STAGE_STATUSES.noIniciada,
    STAGE_STATUSES.planificada,
    STAGE_STATUSES.enCurso,
    STAGE_STATUSES.bloqueada,
    STAGE_STATUSES.completada,
    STAGE_STATUSES.pausada,
  ]),
  owner_id: z.string().uuid().optional().or(z.literal('')),
  planned_start: optionalDate,
  planned_end: optionalDate,
  summary: optionalText,
})

export const milestoneSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre del hito.').max(180),
  description: optionalText,
  stage_id: z.string().uuid(),
  target_date: optionalDate,
  reached_date: optionalDate,
  status: z.enum([
    MILESTONE_STATUSES.pendiente,
    MILESTONE_STATUSES.alcanzado,
    MILESTONE_STATUSES.cancelado,
  ]),
  owner_id: z.string().uuid().optional().or(z.literal('')),
  evidence: optionalText,
  notes: optionalText,
})

export const progressUpdateSchema = z.object({
  stage_id: z.string().uuid('Elegí una etapa.'),
  occurred_on: z.string().min(1, 'Ingresá la fecha.'),
  title: z.string().trim().min(2, 'Ingresá un título.').max(180),
  description: optionalText,
  difficulties: optionalText,
  decisions_taken: optionalText,
  next_steps: optionalText,
  related_task_ids: z.array(z.string().uuid()),
})

export type TaskFormValues = z.infer<typeof taskSchema>
export type TaskCommentValues = z.infer<typeof taskCommentSchema>
export type StageMetaValues = z.infer<typeof stageMetaSchema>
export type MilestoneFormValues = z.infer<typeof milestoneSchema>
export type ProgressUpdateValues = z.infer<typeof progressUpdateSchema>
