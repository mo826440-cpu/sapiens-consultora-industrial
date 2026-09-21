import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { TASK_PRIORITIES, TASK_STATUSES } from '@/config/constants.ts'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/config/labels.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { canEditTask, canWriteProject } from '@/features/auth/roles.ts'
import { taskSchema, type TaskFormValues } from '@/schemas/tracking.ts'
import {
  createTask,
  fetchAllDependencies,
  fetchProfilesForSelect,
  fetchStages,
  fetchTask,
  fetchTaskAssignees,
  fetchTaskDependencies,
  fetchTasks,
  toTaskWriteValues,
  updateTask,
} from '@/services/tracking.ts'
import { formatTags, wouldCreateCycle } from '@/utils/tracking.ts'

const emptyValues: TaskFormValues = {
  title: '',
  description: '',
  stage_id: '',
  category: '',
  priority: TASK_PRIORITIES.media,
  status: TASK_STATUSES.pendiente,
  owner_id: '',
  start_date: '',
  due_date: '',
  progress_percent: 0,
  notes: '',
  tags: '',
  assignee_ids: [],
  depends_on_ids: [],
}

export function TaskFormPage() {
  const { taskId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const isEdit = Boolean(taskId)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stagesQuery = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data, error } = await fetchStages()
      if (error) {
        throw error
      }
      return data ?? []
    },
  })

  const profilesQuery = useQuery({
    queryKey: ['profiles-select'],
    queryFn: async () => {
      const { data, error } = await fetchProfilesForSelect()
      if (error) {
        throw error
      }
      return data ?? []
    },
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await fetchTasks()
      if (error) {
        throw error
      }
      return data ?? []
    },
  })

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    enabled: isEdit,
    queryFn: async () => {
      const [{ data: task, error }, assignees, dependencies] = await Promise.all([
        fetchTask(taskId ?? ''),
        fetchTaskAssignees(taskId ?? ''),
        fetchTaskDependencies(taskId ?? ''),
      ])
      if (error) {
        throw error
      }
      if (!task) {
        throw new Error('La tarea no existe.')
      }
      return {
        task,
        assigneeIds: (assignees.data ?? []).map((row) => row.user_id),
        dependsOnIds: (dependencies.data ?? []).map((row) => row.depends_on_task_id),
      }
    },
  })

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    values: taskQuery.data
      ? {
          title: taskQuery.data.task.title,
          description: taskQuery.data.task.description ?? '',
          stage_id: taskQuery.data.task.stage_id,
          category: taskQuery.data.task.category ?? '',
          priority: taskQuery.data.task.priority,
          status: taskQuery.data.task.status,
          owner_id: taskQuery.data.task.owner_id ?? '',
          start_date: taskQuery.data.task.start_date ?? '',
          due_date: taskQuery.data.task.due_date ?? '',
          progress_percent: Number(taskQuery.data.task.progress_percent),
          notes: taskQuery.data.task.notes ?? '',
          tags: formatTags(taskQuery.data.task.tags),
          assignee_ids: taskQuery.data.assigneeIds,
          depends_on_ids: taskQuery.data.dependsOnIds,
        }
      : {
          ...emptyValues,
          stage_id: searchParams.get('etapa') ?? '',
        },
  })

  const assigneeIds = form.watch('assignee_ids')
  const dependsOnIds = form.watch('depends_on_ids')
  const canSubmit = isEdit
    ? canEditTask(role, user?.id, taskQuery.data?.task ?? { owner_id: null, created_by: null }, taskQuery.data?.assigneeIds ?? [])
    : canWriteProject(role)

  const otherTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((task) => task.id !== taskId),
    [tasksQuery.data, taskId],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) {
      return
    }

    setSubmitError(null)

    if (isEdit && taskId) {
      const { data: edges, error: edgesError } = await fetchAllDependencies()
      if (edgesError) {
        setSubmitError('No se pudieron validar las dependencias.')
        return
      }

      if (wouldCreateCycle(taskId, values.depends_on_ids, edges ?? [])) {
        setSubmitError('Esa dependencia formaría un ciclo. Elegí otra tarea.')
        return
      }
    }

    const payload = toTaskWriteValues(values)
    const result = isEdit && taskId
      ? await updateTask(taskId, payload, values.assignee_ids, values.depends_on_ids, user.id)
      : await createTask(payload, values.assignee_ids, values.depends_on_ids, user.id)

    if (result.error || !result.data) {
      setSubmitError(result.error?.message ?? 'No se pudo guardar la tarea.')
      return
    }

    void navigate(`/tareas/${result.data.id}`)
  })

  if (isEdit && taskQuery.isLoading) {
    return <p className="text-secondary">Cargando tarea…</p>
  }

  if (isEdit && (taskQuery.isError || !taskQuery.data)) {
    return <p className="text-danger">No se encontró la tarea.</p>
  }

  if (!canSubmit) {
    return <p className="text-danger">No tenés permiso para {isEdit ? 'editar' : 'crear'} esta tarea.</p>
  }

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '52rem' }}>
      <p className="text-secondary mb-1">
        <Link to="/tareas">Tareas</Link> / {isEdit ? 'Editar' : 'Nueva'}
      </p>
      <h2 className="h3 mb-4">{isEdit ? 'Editar tarea' : 'Nueva tarea'}</h2>
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

      <Form onSubmit={onSubmit} noValidate className="surface-card p-3 p-md-4">
        <Form.Group className="mb-3" controlId="task-title">
          <Form.Label>Título</Form.Label>
          <Form.Control {...form.register('title')} />
          {form.formState.errors.title ? (
            <Form.Text className="text-danger">{form.formState.errors.title.message}</Form.Text>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-3" controlId="task-description">
          <Form.Label>Descripción</Form.Label>
          <Form.Control as="textarea" rows={3} {...form.register('description')} />
        </Form.Group>

        <div className="row g-3">
          <div className="col-md-6">
            <Form.Label htmlFor="task-stage">Etapa</Form.Label>
            <Form.Select id="task-stage" {...form.register('stage_id')}>
              <option value="">Elegí una etapa</option>
              {stagesQuery.data?.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Form.Select>
            {form.formState.errors.stage_id ? (
              <Form.Text className="text-danger">{form.formState.errors.stage_id.message}</Form.Text>
            ) : null}
          </div>
          <div className="col-md-3">
            <Form.Label htmlFor="task-status">Estado</Form.Label>
            <Form.Select id="task-status" {...form.register('status')}>
              {Object.values(TASK_STATUSES).map((value) => (
                <option key={value} value={value}>
                  {TASK_STATUS_LABELS[value]}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Label htmlFor="task-priority">Prioridad</Form.Label>
            <Form.Select id="task-priority" {...form.register('priority')}>
              {Object.values(TASK_PRIORITIES).map((value) => (
                <option key={value} value={value}>
                  {TASK_PRIORITY_LABELS[value]}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-owner">Responsable</Form.Label>
            <Form.Select id="task-owner" {...form.register('owner_id')}>
              <option value="">Sin asignar</option>
              {profilesQuery.data?.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-start">Inicio</Form.Label>
            <Form.Control id="task-start" type="date" {...form.register('start_date')} />
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-due">Fecha límite</Form.Label>
            <Form.Control id="task-due" type="date" {...form.register('due_date')} />
            {form.formState.errors.due_date ? (
              <Form.Text className="text-danger">{form.formState.errors.due_date.message}</Form.Text>
            ) : null}
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-progress">Avance (%)</Form.Label>
            <Form.Control id="task-progress" type="number" min={0} max={100} {...form.register('progress_percent')} />
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-category">Categoría</Form.Label>
            <Form.Control id="task-category" {...form.register('category')} />
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-tags">Etiquetas</Form.Label>
            <Form.Control id="task-tags" placeholder="separadas por coma" {...form.register('tags')} />
          </div>
          <div className="col-12">
            <Form.Label htmlFor="task-notes">Observaciones</Form.Label>
            <Form.Control id="task-notes" as="textarea" rows={2} {...form.register('notes')} />
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="h6">Colaboradores</legend>
          <div className="row">
            {profilesQuery.data?.map((profile) => (
              <div className="col-md-6" key={profile.id}>
                <Form.Check
                  type="checkbox"
                  id={`assignee-${profile.id}`}
                  label={profile.full_name}
                  checked={assigneeIds.includes(profile.id)}
                  onChange={(event) => {
                    form.setValue(
                      'assignee_ids',
                      event.target.checked
                        ? [...assigneeIds, profile.id]
                        : assigneeIds.filter((id) => id !== profile.id),
                    )
                  }}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="h6">Depende de</legend>
          {otherTasks.length ? (
            otherTasks.map((task) => (
              <Form.Check
                key={task.id}
                type="checkbox"
                id={`depends-${task.id}`}
                label={task.title}
                checked={dependsOnIds.includes(task.id)}
                onChange={(event) => {
                  form.setValue(
                    'depends_on_ids',
                    event.target.checked
                      ? [...dependsOnIds, task.id]
                      : dependsOnIds.filter((id) => id !== task.id),
                  )
                }}
              />
            ))
          ) : (
            <p className="text-secondary mb-0">Todavía no hay otras tareas para encadenar.</p>
          )}
        </fieldset>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Guardar
          </Button>
          <Link className="btn btn-outline-secondary" to={taskId ? `/tareas/${taskId}` : '/tareas'}>
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  )
}
