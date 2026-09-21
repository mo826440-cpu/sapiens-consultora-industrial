import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Form } from 'react-bootstrap'

import { EmptyState } from '@/components/common/EmptyState.tsx'
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/StatusBadge.tsx'
import { TASK_STATUSES, type TaskStatus } from '@/config/constants.ts'
import { TASK_STATUS_LABELS } from '@/config/labels.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { canWriteProject } from '@/features/auth/roles.ts'
import { formatDateAR } from '@/lib/dates.ts'
import { fetchStages, fetchTasks, type TaskWithRelations } from '@/services/tracking.ts'
import { isTaskOverdue } from '@/utils/tracking.ts'

export function TasksPage() {
  const { role } = useAuth()
  const canWrite = canWriteProject(role)
  const [stageId, setStageId] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [search, setSearch] = useState('')

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
    queryKey: ['tasks', { stageId, status, search }],
    queryFn: async () => {
      const { data, error } = await fetchTasks({
        stageId: stageId || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
      })
      if (error) {
        throw error
      }
      return (data ?? []) as TaskWithRelations[]
    },
  })

  const overdueCount = useMemo(
    () => tasksQuery.data?.filter((task) => isTaskOverdue(task.status, task.due_date)).length ?? 0,
    [tasksQuery.data],
  )

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div>
          <p className="text-secondary mb-1">Trabajo operativo</p>
          <h2 className="h3 mb-0">Tareas</h2>
        </div>
        {canWrite ? (
          <Link className="btn btn-primary" to="/tareas/nueva">
            Nueva tarea
          </Link>
        ) : null}
      </div>

      <section className="surface-card p-3 p-md-4 mb-3">
        <div className="row g-3">
          <div className="col-md-4">
            <Form.Label htmlFor="task-filter-search">Buscar</Form.Label>
            <Form.Control
              id="task-filter-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
              placeholder="Título"
            />
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-filter-stage">Etapa</Form.Label>
            <Form.Select
              id="task-filter-stage"
              value={stageId}
              onChange={(event) => {
                setStageId(event.target.value)
              }}
            >
              <option value="">Todas</option>
              {stagesQuery.data?.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-4">
            <Form.Label htmlFor="task-filter-status">Estado</Form.Label>
            <Form.Select
              id="task-filter-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TaskStatus | '')
              }}
            >
              <option value="">Todos</option>
              {Object.values(TASK_STATUSES).map((value) => (
                <option key={value} value={value}>
                  {TASK_STATUS_LABELS[value]}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
      </section>

      {tasksQuery.isLoading ? <p className="text-secondary">Cargando tareas…</p> : null}
      {tasksQuery.isError ? (
        <p className="text-danger">No se pudieron cargar las tareas. Aplicá la migración de la Fase 3.</p>
      ) : null}

      {tasksQuery.data?.length ? (
        <>
          {overdueCount > 0 ? (
            <p className="text-danger">{overdueCount} tarea{overdueCount === 1 ? '' : 's'} vencida{overdueCount === 1 ? '' : 's'}.</p>
          ) : null}
          <div className="table-responsive surface-card">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Etapa</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Límite</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {tasksQuery.data.map((task) => {
                  const overdue = isTaskOverdue(task.status, task.due_date)
                  return (
                    <tr key={task.id}>
                      <td>
                        <Link to={`/tareas/${task.id}`}>{task.title}</Link>
                        {overdue ? <span className="badge text-bg-danger ms-2">Vencida</span> : null}
                      </td>
                      <td>{task.project_stages?.name ?? '—'}</td>
                      <td>
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td>
                        <TaskPriorityBadge priority={task.priority} />
                      </td>
                      <td>{formatDateAR(task.due_date)}</td>
                      <td>{Number(task.progress_percent).toFixed(0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tasksQuery.data && tasksQuery.data.length === 0 ? (
        <EmptyState
          title="Todavía no hay tareas"
          description="Las tareas operativas se cargan por etapa. El checklist metodológico vive en el detalle de cada etapa."
          icon="bi-check2-square"
        />
      ) : null}
    </div>
  )
}
