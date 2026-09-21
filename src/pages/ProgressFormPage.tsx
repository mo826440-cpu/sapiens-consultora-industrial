import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { useAuth } from '@/features/auth/auth-context.ts'
import { canWriteProject } from '@/features/auth/roles.ts'
import { todayInCordoba } from '@/lib/dates.ts'
import { progressUpdateSchema, type ProgressUpdateValues } from '@/schemas/tracking.ts'
import { createProgressUpdate, fetchStages, fetchTasks } from '@/services/tracking.ts'
import { emptyToNull } from '@/utils/tracking.ts'

export function ProgressFormPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const canWrite = canWriteProject(role)

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

  const form = useForm<ProgressUpdateValues>({
    resolver: zodResolver(progressUpdateSchema),
    defaultValues: {
      stage_id: searchParams.get('etapa') ?? '',
      occurred_on: todayInCordoba(),
      title: '',
      description: '',
      difficulties: '',
      decisions_taken: '',
      next_steps: '',
      related_task_ids: [],
    },
  })

  const stageId = form.watch('stage_id')
  const relatedIds = form.watch('related_task_ids')
  const relatedTasks = (tasksQuery.data ?? []).filter((task) => !stageId || task.stage_id === stageId)

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) {
      return
    }

    setSubmitError(null)
    const { error } = await createProgressUpdate(
      {
        stage_id: values.stage_id,
        occurred_on: values.occurred_on,
        title: values.title,
        description: emptyToNull(values.description),
        difficulties: emptyToNull(values.difficulties),
        decisions_taken: emptyToNull(values.decisions_taken),
        next_steps: emptyToNull(values.next_steps),
        created_by: user.id,
        updated_by: user.id,
      },
      values.related_task_ids,
    )

    if (error) {
      setSubmitError(error.message)
      return
    }

    void navigate('/avances')
  })

  if (!canWrite) {
    return <p className="text-danger">No tenés permiso para registrar avances.</p>
  }

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '52rem' }}>
      <p className="text-secondary mb-1">
        <Link to="/avances">Avances</Link> / Nuevo
      </p>
      <h2 className="h3 mb-4">Registrar avance</h2>
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

      <Form onSubmit={onSubmit} noValidate className="surface-card p-3 p-md-4">
        <div className="row g-3">
          <div className="col-md-8">
            <Form.Label htmlFor="progress-title">Título</Form.Label>
            <Form.Control id="progress-title" {...form.register('title')} />
            {form.formState.errors.title ? (
              <Form.Text className="text-danger">{form.formState.errors.title.message}</Form.Text>
            ) : null}
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="progress-date">Fecha</Form.Label>
            <Form.Control id="progress-date" type="date" {...form.register('occurred_on')} />
          </div>
          <div className="col-md-12">
            <Form.Label htmlFor="progress-stage">Etapa</Form.Label>
            <Form.Select id="progress-stage" {...form.register('stage_id')}>
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
          <div className="col-12">
            <Form.Label htmlFor="progress-description">Qué ocurrió</Form.Label>
            <Form.Control id="progress-description" as="textarea" rows={3} {...form.register('description')} />
          </div>
          <div className="col-12">
            <Form.Label htmlFor="progress-difficulties">Dificultades</Form.Label>
            <Form.Control id="progress-difficulties" as="textarea" rows={2} {...form.register('difficulties')} />
          </div>
          <div className="col-12">
            <Form.Label htmlFor="progress-decisions">Decisiones</Form.Label>
            <Form.Control id="progress-decisions" as="textarea" rows={2} {...form.register('decisions_taken')} />
          </div>
          <div className="col-12">
            <Form.Label htmlFor="progress-next">Próximos pasos</Form.Label>
            <Form.Control id="progress-next" as="textarea" rows={2} {...form.register('next_steps')} />
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="h6">Tareas relacionadas</legend>
          {relatedTasks.length ? (
            relatedTasks.map((task) => (
              <Form.Check
                key={task.id}
                type="checkbox"
                id={`progress-task-${task.id}`}
                label={task.title}
                checked={relatedIds.includes(task.id)}
                onChange={(event) => {
                  form.setValue(
                    'related_task_ids',
                    event.target.checked
                      ? [...relatedIds, task.id]
                      : relatedIds.filter((id) => id !== task.id),
                  )
                }}
              />
            ))
          ) : (
            <p className="text-secondary mb-0">No hay tareas en la etapa elegida.</p>
          )}
        </fieldset>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Guardar avance
          </Button>
          <Link className="btn btn-outline-secondary" to="/avances">
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  )
}
