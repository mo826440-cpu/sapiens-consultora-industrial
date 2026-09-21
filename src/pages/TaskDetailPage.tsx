import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { ConfirmDialog } from '@/components/common/ConfirmDialog.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/StatusBadge.tsx'
import { useAuth } from '@/features/auth/auth-context.ts'
import { canEditTask, canWriteProject, isStaffRole } from '@/features/auth/roles.ts'
import { formatDateAR, formatDateTimeAR } from '@/lib/dates.ts'
import { taskCommentSchema, type TaskCommentValues } from '@/schemas/tracking.ts'
import {
  createTaskComment,
  deleteTask,
  deleteTaskComment,
  fetchTask,
  fetchTaskAssignees,
  fetchTaskComments,
  fetchTaskDependencies,
  type TaskWithRelations,
} from '@/services/tracking.ts'
import { formatTags, isTaskOverdue } from '@/utils/tracking.ts'

export function TaskDetailPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, role } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      const [task, assignees, dependencies, comments] = await Promise.all([
        fetchTask(taskId ?? ''),
        fetchTaskAssignees(taskId ?? ''),
        fetchTaskDependencies(taskId ?? ''),
        fetchTaskComments(taskId ?? ''),
      ])
      if (task.error) {
        throw task.error
      }
      return {
        task: task.data as TaskWithRelations | null,
        assignees: assignees.data ?? [],
        dependencies: dependencies.data ?? [],
        comments: comments.data ?? [],
      }
    },
  })

  const commentForm = useForm<TaskCommentValues>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: { body: '' },
  })

  const addComment = useMutation({
    mutationFn: async (values: TaskCommentValues) => {
      if (!user || !taskId) {
        throw new Error('Sesión inválida.')
      }
      const { error: insertError } = await createTaskComment(taskId, values.body, user.id)
      if (insertError) {
        throw insertError
      }
    },
    onSuccess: async () => {
      commentForm.reset()
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
    onError: () => {
      setError('No se pudo publicar el comentario.')
    },
  })

  if (taskQuery.isLoading) {
    return <p className="text-secondary">Cargando tarea…</p>
  }

  if (taskQuery.isError || !taskQuery.data?.task) {
    return (
      <EmptyState
        title="Tarea no encontrada"
        description="Puede que aún no exista la migración de la Fase 3 o que el enlace sea incorrecto."
      />
    )
  }

  const { task, assignees, dependencies, comments } = taskQuery.data
  const assigneeIds = assignees.map((row) => row.user_id)
  const canEdit = canEditTask(role, user?.id, task, assigneeIds)
  const canComment = canWriteProject(role)
  const canDelete = isStaffRole(role)
  const overdue = isTaskOverdue(task.status, task.due_date)

  return (
    <div className="container-fluid px-0">
      <p className="text-secondary mb-1">
        <Link to="/tareas">Tareas</Link>
        {task.project_stages ? (
          <>
            {' / '}
            <Link to={`/ruta/${task.project_stages.slug}`}>{task.project_stages.name}</Link>
          </>
        ) : null}
      </p>
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h3 mb-2">{task.title}</h2>
          <div className="d-flex flex-wrap gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            {overdue ? <span className="badge text-bg-danger">Vencida</span> : null}
          </div>
        </div>
        <div className="d-flex gap-2">
          {canEdit ? (
            <Link className="btn btn-outline-primary" to={`/tareas/${task.id}/editar`}>
              Editar
            </Link>
          ) : null}
          {canDelete ? (
            <button type="button" className="btn btn-outline-danger" onClick={() => { setDeleteOpen(true) }}>
              Eliminar
            </button>
          ) : null}
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="surface-card p-3 p-md-4 mb-3">
        <h3 className="h5 mb-3">Detalle</h3>
        <p className="mb-2">{task.description || 'Sin descripción.'}</p>
        <p className="mb-1">Responsable: {task.profiles?.full_name ?? 'Sin asignar'}</p>
        <p className="mb-1">
          Fechas: {formatDateAR(task.start_date)} — {formatDateAR(task.due_date)}
        </p>
        <p className="mb-1">Avance: {Number(task.progress_percent).toFixed(0)}%</p>
        <p className="mb-1">Categoría: {task.category || '—'}</p>
        <p className="mb-1">Etiquetas: {formatTags(task.tags) || '—'}</p>
        <p className="mb-0">Observaciones: {task.notes || '—'}</p>
      </section>

      <section className="surface-card p-3 p-md-4 mb-3">
        <h3 className="h5 mb-3">Equipo y dependencias</h3>
        <p className="mb-1">
          Colaboradores:{' '}
          {assignees.length
            ? assignees
                .map((row) => {
                  const profile = row.profiles as { full_name?: string } | { full_name?: string }[] | null
                  const name = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name
                  return name ?? row.user_id
                })
                .join(', ')
            : 'Ninguno'}
        </p>
        <p className="mb-0">
          Depende de:{' '}
          {dependencies.length
            ? dependencies
                .map((row) => {
                  const related = row.tasks as { title?: string } | { title?: string }[] | null
                  const title = Array.isArray(related) ? related[0]?.title : related?.title
                  return title ?? row.depends_on_task_id
                })
                .join(', ')
            : 'Ninguna'}
        </p>
      </section>

      <section className="surface-card p-3 p-md-4 mb-3">
        <h3 className="h5 mb-3">Comentarios</h3>
        {canComment ? (
          <Form
            className="mb-4"
            onSubmit={commentForm.handleSubmit((values) => {
              setError(null)
              addComment.mutate(values)
            })}
          >
            <Form.Label htmlFor="task-comment">Nuevo comentario</Form.Label>
            <Form.Control id="task-comment" as="textarea" rows={3} {...commentForm.register('body')} />
            {commentForm.formState.errors.body ? (
              <Form.Text className="text-danger">{commentForm.formState.errors.body.message}</Form.Text>
            ) : null}
            <Button type="submit" className="mt-2" disabled={addComment.isPending}>
              Publicar
            </Button>
          </Form>
        ) : null}

        {comments.length ? (
          <ul className="list-unstyled mb-0">
            {comments.map((comment) => {
              const author = (comment as { profiles?: { full_name?: string } | null }).profiles
              const own = comment.created_by === user?.id
              const canRemove = isStaffRole(role) || own
              return (
                <li key={comment.id} className="border-bottom py-2">
                  <p className="small text-secondary mb-1">
                    {author?.full_name ?? 'Usuario'} · {formatDateTimeAR(comment.created_at)}
                  </p>
                  <p className="mb-1">{comment.body}</p>
                  {canRemove ? (
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0"
                      onClick={() => {
                        void deleteTaskComment(comment.id).then(() => {
                          void queryClient.invalidateQueries({ queryKey: ['task', taskId] })
                        })
                      }}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-secondary mb-0">Todavía no hay comentarios.</p>
        )}
      </section>

      <ConfirmDialog
        show={deleteOpen}
        title="Eliminar tarea"
        message="Se borrarán comentarios, asignaciones y dependencias. Esta acción no se puede deshacer."
        onCancel={() => {
          setDeleteOpen(false)
        }}
        onConfirm={() => {
          if (!taskId) {
            return
          }
          void deleteTask(taskId, task.stage_id).then(({ error: deleteError }) => {
            if (deleteError) {
              setError('No se pudo eliminar la tarea.')
              setDeleteOpen(false)
              return
            }
            void navigate('/tareas')
          })
        }}
      />
    </div>
  )
}
