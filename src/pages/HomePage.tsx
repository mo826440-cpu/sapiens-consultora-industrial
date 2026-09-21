import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/common/EmptyState.tsx'
import { formatDateAR } from '@/lib/dates.ts'
import { fetchProgressUpdates, fetchStages, fetchTaskCounts } from '@/services/tracking.ts'
import { isTaskOverdue } from '@/utils/tracking.ts'

export function HomePage() {
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
    queryKey: ['task-counts'],
    queryFn: async () => {
      const { data, error } = await fetchTaskCounts()
      if (error) {
        throw error
      }
      return data ?? []
    },
  })

  const updatesQuery = useQuery({
    queryKey: ['progress-updates'],
    queryFn: async () => {
      const { data, error } = await fetchProgressUpdates()
      if (error) {
        throw error
      }
      return data ?? []
    },
  })

  const stages = stagesQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const overall =
    stages.length === 0
      ? 0
      : stages.reduce((sum, stage) => sum + Number(stage.progress_percent), 0) / stages.length
  const openTasks = tasks.filter((task) => task.status !== 'finalizada').length
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task.status, task.due_date)).length
  const blockedTasks = tasks.filter((task) => task.status === 'bloqueada').length
  const recentUpdates = (updatesQuery.data ?? []).slice(0, 5)
  const loadError = stagesQuery.isError || tasksQuery.isError

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <p className="text-secondary mb-1">Panel general</p>
        <h2 className="h3 mb-2">Seguimiento del proyecto</h2>
        <p className="mb-0 text-secondary">
          Los indicadores salen de etapas, tareas y avances reales. No se muestran datos simulados
          como si fueran reales.
        </p>
      </div>

      {loadError ? (
        <p className="text-danger">No se pudieron cargar los indicadores. Aplicá la migración de la Fase 3.</p>
      ) : null}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <article className="kpi-card p-3 h-100">
            <p className="small text-secondary mb-1">Avance de la ruta</p>
            <p className="display-6 mb-0">{overall.toFixed(0)}%</p>
          </article>
        </div>
        <div className="col-12 col-md-3">
          <article className="kpi-card p-3 h-100">
            <p className="small text-secondary mb-1">Tareas abiertas</p>
            <p className="display-6 mb-0">{openTasks}</p>
          </article>
        </div>
        <div className="col-12 col-md-3">
          <article className="kpi-card p-3 h-100">
            <p className="small text-secondary mb-1">Vencidas</p>
            <p className="display-6 mb-0">{overdueTasks}</p>
          </article>
        </div>
        <div className="col-12 col-md-3">
          <article className="kpi-card p-3 h-100">
            <p className="small text-secondary mb-1">Bloqueadas</p>
            <p className="display-6 mb-0">{blockedTasks}</p>
          </article>
        </div>
      </div>

      <section className="surface-card p-3 p-md-4" aria-labelledby="actividad-titulo">
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
          <h3 id="actividad-titulo" className="h5 mb-0">
            Últimos avances
          </h3>
          <Link to="/avances">Ver bitácora</Link>
        </div>
        {updatesQuery.isLoading ? <p className="text-secondary mb-0">Cargando avances…</p> : null}
        {recentUpdates.length ? (
          <ul className="list-unstyled mb-0">
            {recentUpdates.map((update) => (
              <li key={update.id} className="border-bottom py-2">
                <strong>{update.title}</strong>
                <p className="small text-secondary mb-0">{formatDateAR(update.occurred_on)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no hay avances registrados"
            description="Cuando existan etapas, tareas o bitácoras, los números de arriba dejarán de estar en cero."
            icon="bi-bar-chart"
          />
        )}
        <div className="text-center pt-3">
          <Link className="btn btn-primary" to="/ruta">
            Ver ruta del proyecto
          </Link>
        </div>
      </section>
    </div>
  )
}
