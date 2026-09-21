import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { ConfirmDialog } from '@/components/common/ConfirmDialog.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { StatusBadge } from '@/components/common/StatusBadge.tsx'
import { STAGE_STATUSES } from '@/config/constants.ts'
import { MILESTONE_STATUS_LABELS, STAGE_STATUS_LABELS, TASK_STATUS_LABELS } from '@/config/labels.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { canWriteProject, isStaffRole } from '@/features/auth/roles.ts'
import { formatDateAR } from '@/lib/dates.ts'
import { stageMetaSchema, milestoneSchema, type MilestoneFormValues, type StageMetaValues } from '@/schemas/tracking.ts'
import {
  deleteMilestone,
  fetchMilestones,
  fetchProfilesForSelect,
  fetchStageBySlug,
  fetchStageItems,
  fetchTasks,
  recalculateStageProgress,
  toNullableStageFields,
  updateStageItemDone,
  updateStageMeta,
  upsertMilestone,
} from '@/services/tracking.ts'

export function StageDetailPage() {
  const { slug } = useParams()
  const { user, role } = useAuth()
  const canWrite = canWriteProject(role)
  const canManage = isStaffRole(role)
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stageQuery = useQuery({
    queryKey: ['stage', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error: queryError } = await fetchStageBySlug(slug ?? '')
      if (queryError) {
        throw queryError
      }
      return data
    },
  })

  const stageId = stageQuery.data?.id

  const itemsQuery = useQuery({
    queryKey: ['stage-items', stageId],
    enabled: Boolean(stageId),
    queryFn: async () => {
      const { data, error: queryError } = await fetchStageItems(stageId ?? '')
      if (queryError) {
        throw queryError
      }
      return data ?? []
    },
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks', stageId],
    enabled: Boolean(stageId),
    queryFn: async () => {
      const { data, error: queryError } = await fetchTasks({ stageId })
      if (queryError) {
        throw queryError
      }
      return data ?? []
    },
  })

  const milestonesQuery = useQuery({
    queryKey: ['milestones', stageId],
    enabled: Boolean(stageId),
    queryFn: async () => {
      const { data, error: queryError } = await fetchMilestones(stageId)
      if (queryError) {
        throw queryError
      }
      return data ?? []
    },
  })

  const profilesQuery = useQuery({
    queryKey: ['profiles-select'],
    queryFn: async () => {
      const { data, error: queryError } = await fetchProfilesForSelect()
      if (queryError) {
        throw queryError
      }
      return data ?? []
    },
  })

  const toggleItem = useMutation({
    mutationFn: async ({ id, isDone }: { id: string; isDone: boolean }) => {
      if (!user || !stageId) {
        throw new Error('Sesión inválida.')
      }
      const { error: updateError } = await updateStageItemDone(id, isDone, user.id)
      if (updateError) {
        throw updateError
      }
      await recalculateStageProgress(stageId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stage', slug] })
      await queryClient.invalidateQueries({ queryKey: ['stage-items', stageId] })
      await queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
    onError: () => {
      setError('No se pudo actualizar el ítem.')
    },
  })

  if (stageQuery.isLoading) {
    return <p className="text-secondary">Cargando etapa…</p>
  }

  if (stageQuery.isError) {
    return (
      <p className="text-danger">No se pudo cargar la etapa. Aplicá la migración de la Fase 3.</p>
    )
  }

  if (!stageQuery.data) {
    return (
      <EmptyState
        title="Etapa no encontrada"
        description="Revisá la ruta o aplicá la migración de la Fase 3."
      />
    )
  }

  const stage = stageQuery.data

  return (
    <div className="container-fluid px-0">
      <p className="text-secondary mb-1">
        <Link to="/ruta">Ruta</Link> / Etapa {stage.sort_order}
      </p>
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h3 mb-2">{stage.name}</h2>
          <StatusBadge status={stage.status} />
          <p className="mt-2 mb-0">
            Avance: <strong>{Number(stage.progress_percent).toFixed(0)}%</strong>
          </p>
        </div>
        {canWrite ? (
          <div className="d-flex gap-2">
            <Link className="btn btn-primary" to={`/tareas/nueva?etapa=${stage.id}`}>
              Nueva tarea
            </Link>
            <Link className="btn btn-outline-primary" to={`/avances/nuevo?etapa=${stage.id}`}>
              Registrar avance
            </Link>
          </div>
        ) : null}
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <section className="surface-card p-3 p-md-4 mb-3">
        <h3 className="h5 mb-3">Checklist metodológico</h3>
        {itemsQuery.data?.length ? (
          <ul className="list-unstyled mb-0">
            {itemsQuery.data.map((item) => (
              <li key={item.id} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id={`item-${item.id}`}
                  label={item.title}
                  checked={item.is_done}
                  disabled={!canWrite || toggleItem.isPending}
                  onChange={(event) => {
                    setError(null)
                    toggleItem.mutate({ id: item.id, isDone: event.target.checked })
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-secondary mb-0">Sin ítems.</p>
        )}
      </section>

      {canManage ? (
        <StageMetaForm
          stageId={stage.id}
          defaultValues={{
            status: stage.status,
            owner_id: stage.owner_id ?? '',
            planned_start: stage.planned_start ?? '',
            planned_end: stage.planned_end ?? '',
            summary: stage.summary ?? '',
          }}
          profiles={profilesQuery.data ?? []}
          onSaved={() => {
            setMessage('Los datos de la etapa se guardaron.')
            void queryClient.invalidateQueries({ queryKey: ['stage', slug] })
            void queryClient.invalidateQueries({ queryKey: ['stages'] })
          }}
        />
      ) : (
        <section className="surface-card p-3 p-md-4 mb-3">
          <h3 className="h5 mb-3">Planificación</h3>
          <p className="mb-1">Estado: {STAGE_STATUS_LABELS[stage.status]}</p>
          <p className="mb-1">
            Fechas: {formatDateAR(stage.planned_start)} — {formatDateAR(stage.planned_end)}
          </p>
          <p className="mb-0">{stage.summary || 'Sin resumen.'}</p>
        </section>
      )}

      <section className="surface-card p-3 p-md-4 mb-3">
        <h3 className="h5 mb-3">Tareas</h3>
        {tasksQuery.data?.length ? (
          <ul className="list-unstyled mb-0">
            {tasksQuery.data.map((task) => (
              <li key={task.id} className="d-flex justify-content-between gap-2 border-bottom py-2">
                <Link to={`/tareas/${task.id}`}>{task.title}</Link>
                <span className="small text-secondary">{TASK_STATUS_LABELS[task.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-secondary mb-0">Todavía no hay tareas en esta etapa.</p>
        )}
      </section>

      <MilestoneSection
        stageId={stage.id}
        canWrite={canWrite}
        canDelete={canManage}
        milestones={milestonesQuery.data ?? []}
        profiles={profilesQuery.data ?? []}
        onChanged={() => {
          void queryClient.invalidateQueries({ queryKey: ['milestones', stageId] })
        }}
      />
    </div>
  )
}

function StageMetaForm({
  stageId,
  defaultValues,
  profiles,
  onSaved,
}: {
  stageId: string
  defaultValues: StageMetaValues
  profiles: { id: string; full_name: string }[]
  onSaved: () => void
}) {
  const { user } = useAuth()
  const form = useForm<StageMetaValues>({
    resolver: zodResolver(stageMetaSchema),
    values: defaultValues,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) {
      return
    }

    const { error } = await updateStageMeta(stageId, {
      status: values.status,
      ...toNullableStageFields(values),
      updated_by: user.id,
    })
    if (error) {
      return
    }
    await recalculateStageProgress(stageId)
    onSaved()
  })

  return (
    <section className="surface-card p-3 p-md-4 mb-3">
      <h3 className="h5 mb-3">Planificación</h3>
      <Form onSubmit={onSubmit}>
        <div className="row g-3">
          <div className="col-md-4">
            <Form.Label htmlFor="stage-status">Estado</Form.Label>
            <Form.Select id="stage-status" {...form.register('status')}>
              {Object.values(STAGE_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {STAGE_STATUS_LABELS[status]}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="stage-owner">Responsable</Form.Label>
            <Form.Select id="stage-owner" {...form.register('owner_id')}>
              <option value="">Sin asignar</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Label htmlFor="stage-start">Inicio</Form.Label>
            <Form.Control id="stage-start" type="date" {...form.register('planned_start')} />
          </div>
          <div className="col-md-2">
            <Form.Label htmlFor="stage-end">Fin</Form.Label>
            <Form.Control id="stage-end" type="date" {...form.register('planned_end')} />
          </div>
          <div className="col-12">
            <Form.Label htmlFor="stage-summary">Resumen</Form.Label>
            <Form.Control id="stage-summary" as="textarea" rows={3} {...form.register('summary')} />
          </div>
        </div>
        <Button type="submit" className="mt-3" disabled={form.formState.isSubmitting}>
          Guardar planificación
        </Button>
      </Form>
    </section>
  )
}

function MilestoneSection({
  stageId,
  canWrite,
  canDelete,
  milestones,
  profiles,
  onChanged,
}: {
  stageId: string
  canWrite: boolean
  canDelete: boolean
  milestones: { id: string; name: string; status: MilestoneFormValues['status']; target_date: string | null }[]
  profiles: { id: string; full_name: string }[]
  onChanged: () => void
}) {
  const { user } = useAuth()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      name: '',
      description: '',
      stage_id: stageId,
      target_date: '',
      reached_date: '',
      status: 'pendiente',
      owner_id: '',
      evidence: '',
      notes: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) {
      return
    }

    const { error } = await upsertMilestone({
      name: values.name,
      description: values.description || null,
      stage_id: stageId,
      target_date: values.target_date || null,
      reached_date: values.reached_date || null,
      status: values.status,
      owner_id: values.owner_id || null,
      evidence: values.evidence || null,
      notes: values.notes || null,
      created_by: user.id,
      updated_by: user.id,
    })
    if (!error) {
      form.reset({ ...form.getValues(), name: '', description: '', evidence: '', notes: '' })
      onChanged()
    }
  })

  return (
    <section className="surface-card p-3 p-md-4 mb-3">
      <h3 className="h5 mb-3">Hitos</h3>
      {milestones.length ? (
        <ul className="list-unstyled">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="d-flex justify-content-between gap-2 border-bottom py-2">
              <div>
                <strong>{milestone.name}</strong>
                <p className="small text-secondary mb-0">
                  {MILESTONE_STATUS_LABELS[milestone.status]} · {formatDateAR(milestone.target_date)}
                </p>
              </div>
              {canDelete ? (
                <button type="button" className="btn btn-link text-danger p-0" onClick={() => { setDeleteId(milestone.id) }}>
                  Eliminar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-secondary">Todavía no hay hitos.</p>
      )}

      {canWrite ? (
        <Form onSubmit={onSubmit} className="mt-3">
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label htmlFor="milestone-name">Nombre</Form.Label>
              <Form.Control id="milestone-name" {...form.register('name')} />
            </div>
            <div className="col-md-3">
              <Form.Label htmlFor="milestone-status">Estado</Form.Label>
              <Form.Select id="milestone-status" {...form.register('status')}>
                <option value="pendiente">Pendiente</option>
                <option value="alcanzado">Alcanzado</option>
                <option value="cancelado">Cancelado</option>
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Form.Label htmlFor="milestone-date">Fecha objetivo</Form.Label>
              <Form.Control id="milestone-date" type="date" {...form.register('target_date')} />
            </div>
            <div className="col-md-6">
              <Form.Label htmlFor="milestone-owner">Responsable</Form.Label>
              <Form.Select id="milestone-owner" {...form.register('owner_id')}>
                <option value="">Sin asignar</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-12">
              <Form.Label htmlFor="milestone-notes">Observaciones</Form.Label>
              <Form.Control id="milestone-notes" as="textarea" rows={2} {...form.register('notes')} />
            </div>
          </div>
          <Button type="submit" className="mt-3" disabled={form.formState.isSubmitting}>
            Agregar hito
          </Button>
        </Form>
      ) : null}

      <ConfirmDialog
        show={Boolean(deleteId)}
        title="Eliminar hito"
        message="Esta acción no se puede deshacer."
        onCancel={() => { setDeleteId(null) }}
        onConfirm={() => {
          if (!deleteId) {
            return
          }
          void deleteMilestone(deleteId).then(() => {
            setDeleteId(null)
            onChanged()
          })
        }}
      />
    </section>
  )
}
