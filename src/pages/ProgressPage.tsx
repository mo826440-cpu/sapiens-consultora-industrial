import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ConfirmDialog } from '@/components/common/ConfirmDialog.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { useAuth } from '@/features/auth/auth-context.ts'
import { canWriteProject, isStaffRole } from '@/features/auth/roles.ts'
import { formatDateAR } from '@/lib/dates.ts'
import { deleteProgressUpdate, fetchProgressUpdates } from '@/services/tracking.ts'

type ProgressListItem = {
  id: string
  title: string
  occurred_on: string
  description: string | null
  difficulties: string | null
  next_steps: string | null
  percent_previous: number
  percent_new: number
  created_by: string | null
  project_stages: { name: string; slug: string } | null
  profiles: { full_name: string } | null
}

export function ProgressPage() {
  const { user, role } = useAuth()
  const queryClient = useQueryClient()
  const canWrite = canWriteProject(role)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const updatesQuery = useQuery({
    queryKey: ['progress-updates'],
    queryFn: async () => {
      const { data, error } = await fetchProgressUpdates()
      if (error) {
        throw error
      }
      return (data ?? []) as ProgressListItem[]
    },
  })

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div>
          <p className="text-secondary mb-1">Bitácora</p>
          <h2 className="h3 mb-0">Avances</h2>
        </div>
        {canWrite ? (
          <Link className="btn btn-primary" to="/avances/nuevo">
            Registrar avance
          </Link>
        ) : null}
      </div>

      {updatesQuery.isLoading ? <p className="text-secondary">Cargando avances…</p> : null}
      {updatesQuery.isError ? (
        <p className="text-danger">No se pudieron cargar los avances. Aplicá la migración de la Fase 3.</p>
      ) : null}

      {updatesQuery.data?.length ? (
        <div className="row g-3">
          {updatesQuery.data.map((update) => {
            const canDelete = isStaffRole(role) || update.created_by === user?.id
            return (
              <div className="col-12" key={update.id}>
                <article className="surface-card p-3 p-md-4">
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div>
                      <h3 className="h5 mb-1">{update.title}</h3>
                      <p className="small text-secondary mb-0">
                        {formatDateAR(update.occurred_on)} · {update.project_stages?.name ?? 'Etapa'} ·{' '}
                        {update.profiles?.full_name ?? 'Autor'}
                      </p>
                    </div>
                    <p className="mb-0">
                      {Number(update.percent_previous).toFixed(0)}% → {Number(update.percent_new).toFixed(0)}%
                    </p>
                  </div>
                  {update.description ? <p className="mt-3 mb-2">{update.description}</p> : null}
                  {update.difficulties ? (
                    <p className="mb-2">
                      <strong>Dificultades: </strong>
                      {update.difficulties}
                    </p>
                  ) : null}
                  {update.next_steps ? (
                    <p className="mb-2">
                      <strong>Próximos pasos: </strong>
                      {update.next_steps}
                    </p>
                  ) : null}
                  {canDelete ? (
                    <button type="button" className="btn btn-link text-danger p-0" onClick={() => { setDeleteId(update.id) }}>
                      Eliminar
                    </button>
                  ) : null}
                </article>
              </div>
            )
          })}
        </div>
      ) : null}

      {updatesQuery.data && updatesQuery.data.length === 0 ? (
        <EmptyState
          title="Todavía no hay avances"
          description="Los avances registran lo ocurrido en una etapa y recalculan el porcentaje a partir de ítems y tareas."
          icon="bi-journal-text"
        />
      ) : null}

      <ConfirmDialog
        show={Boolean(deleteId)}
        title="Eliminar avance"
        message="Esta acción no se puede deshacer."
        onCancel={() => {
          setDeleteId(null)
        }}
        onConfirm={() => {
          if (!deleteId) {
            return
          }
          void deleteProgressUpdate(deleteId).then(() => {
            setDeleteId(null)
            void queryClient.invalidateQueries({ queryKey: ['progress-updates'] })
            void queryClient.invalidateQueries({ queryKey: ['stages'] })
          })
        }}
      />
    </div>
  )
}
