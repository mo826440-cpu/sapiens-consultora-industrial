import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/common/EmptyState.tsx'
import { StatusBadge } from '@/components/common/StatusBadge.tsx'
import { formatDateAR } from '@/lib/dates.ts'
import { fetchAllStageItems, fetchStages, fetchTasks } from '@/services/tracking.ts'
import type { StageRow } from '@/types/database.types.ts'

type StageWithOwner = StageRow & {
  profiles: { full_name: string } | null
}

export function RoadmapPage() {
  const stagesQuery = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data, error } = await fetchStages()
      if (error) {
        throw error
      }
      return (data ?? []) as StageWithOwner[]
    },
  })

  const extrasQuery = useQuery({
    queryKey: ['roadmap-extras'],
    queryFn: async () => {
      const [items, tasks] = await Promise.all([fetchAllStageItems(), fetchTasks()])
      if (items.error) {
        throw items.error
      }
      if (tasks.error) {
        throw tasks.error
      }
      return { items: items.data ?? [], tasks: tasks.data ?? [] }
    },
  })

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <p className="text-secondary mb-1">Ruta inicial</p>
        <h2 className="h3 mb-2">De la idea al primer cliente</h2>
        <p className="text-secondary mb-0">
          Avance, estado y responsables salen de Supabase. Las etapas en cero todavía no tienen
          trabajo registrado.
        </p>
      </div>

      {stagesQuery.isLoading ? <p className="text-secondary">Cargando la ruta…</p> : null}
      {stagesQuery.isError ? (
        <p className="text-danger">No se pudieron cargar las etapas. Aplicá la migración de la Fase 3.</p>
      ) : null}
      {stagesQuery.data && stagesQuery.data.length === 0 ? (
        <EmptyState
          title="Todavía no hay etapas"
          description="Ejecutá la migración 20260920220000 en el SQL Editor de Supabase."
        />
      ) : null}

      <div className="row g-3">
        {stagesQuery.data?.map((stage) => {
          const items = extrasQuery.data?.items.filter((item) => item.stage_id === stage.id) ?? []
          const tasks = extrasQuery.data?.tasks.filter((task) => task.stage_id === stage.id) ?? []
          const doneItems = items.filter((item) => item.is_done).length
          const pendingTasks = tasks.filter((task) => task.status !== 'finalizada').length
          const blocked = stage.status === 'bloqueada' || tasks.some((task) => task.status === 'bloqueada')

          return (
            <div className="col-12 col-md-6 col-xxl-3" key={stage.id}>
              <article className="stage-card p-3 d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                  <span className="stage-index" aria-hidden="true">
                    {stage.sort_order}
                  </span>
                  <StatusBadge status={stage.status} />
                </div>
                <h3 className="h5">{stage.name}</h3>
                <p className="mb-2">
                  <strong>{Number(stage.progress_percent).toFixed(0)}%</strong>
                  <span className="text-secondary"> de avance</span>
                </p>
                <p className="small text-secondary mb-1">
                  Responsable: {stage.profiles?.full_name ?? 'Sin asignar'}
                </p>
                <p className="small text-secondary mb-1">
                  Fechas: {formatDateAR(stage.planned_start)} — {formatDateAR(stage.planned_end)}
                </p>
                <p className="small text-secondary mb-1">
                  Checklist: {doneItems}/{items.length || 0}
                </p>
                <p className="small text-secondary mb-3">Tareas pendientes: {pendingTasks}</p>
                {blocked ? <p className="small text-danger">Hay un bloqueo en esta etapa.</p> : null}
                <Link className="btn btn-outline-primary mt-auto" to={`/ruta/${stage.slug}`}>
                  Ver detalle
                </Link>
              </article>
            </div>
          )
        })}
      </div>
    </div>
  )
}
