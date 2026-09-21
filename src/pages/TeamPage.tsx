import { useMemo, useState } from 'react'
import { Alert, Form, Table } from 'react-bootstrap'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { APP_ROLES, type AppRole } from '@/config/constants.ts'
import { ROLE_LABELS } from '@/features/auth/roles.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { isAdminRole } from '@/features/auth/roles.ts'
import { assignUserRole, fetchRoles, fetchTeamMembers } from '@/services/auth.ts'
import { translateAuthError } from '@/features/auth/auth-errors.ts'
import { EmptyState } from '@/components/common/EmptyState.tsx'

type MemberRole = {
  id: string
  role_id: string
  roles: { code: AppRole; name: string } | null
}

type TeamMember = {
  id: string
  full_name: string
  job_title: string | null
  is_active: boolean
  user_roles: MemberRole[] | MemberRole | null
}

function roleFromMember(member: TeamMember): AppRole | null {
  const assignment = Array.isArray(member.user_roles) ? member.user_roles[0] : member.user_roles
  return assignment?.roles?.code ?? null
}

export function TeamPage() {
  const { user, role } = useAuth()
  const canEdit = isAdminRole(role)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error: queryError } = await fetchTeamMembers()
      if (queryError) {
        throw queryError
      }
      return (data ?? []) as unknown as TeamMember[]
    },
  })

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error: queryError } = await fetchRoles()
      if (queryError) {
        throw queryError
      }
      return data ?? []
    },
  })

  const mutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      if (!user) {
        throw new Error('No hay una sesión activa.')
      }
      const { error: assignError } = await assignUserRole(userId, roleId, user.id)
      if (assignError) {
        throw assignError
      }
    },
    onSuccess: async () => {
      setSuccess('El rol se actualizó.')
      await queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
    onError: (assignError: Error) => {
      setError(translateAuthError(assignError.message))
    },
  })

  const roleOptions = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])

  return (
    <div className="container-fluid px-0">
      <p className="text-secondary mb-1">Administración</p>
      <h2 className="h3 mb-2">Equipo</h2>
      <p className="text-secondary">
        El alta de usuarios se hace en el panel de Supabase. Acá se asigna el rol. No hay registro
        público.
      </p>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}
      {membersQuery.isError ? (
        <Alert variant="danger">No se pudo cargar el equipo. Revisá permisos y la conexión.</Alert>
      ) : null}

      {membersQuery.isLoading ? <p className="text-secondary">Cargando equipo…</p> : null}

      {membersQuery.data && membersQuery.data.length === 0 ? (
        <EmptyState
          title="Todavía no hay perfiles"
          description="Creá el primer usuario en el panel de Supabase y volvé a esta pantalla."
          icon="bi-people"
        />
      ) : null}

      {membersQuery.data && membersQuery.data.length > 0 ? (
        <>
          <div className="d-none d-md-block surface-card p-0 overflow-hidden">
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Estado</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {membersQuery.data.map((member) => (
                  <tr key={member.id}>
                    <td>{member.full_name}</td>
                    <td>{member.job_title || '—'}</td>
                    <td>{member.is_active ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      {canEdit ? (
                        <Form.Select
                          aria-label={`Rol de ${member.full_name}`}
                          value={roleOptions.find((item) => item.code === roleFromMember(member))?.id ?? ''}
                          disabled={mutation.isPending}
                          onChange={(event) => {
                            setError(null)
                            setSuccess(null)
                            if (!event.target.value) {
                              return
                            }
                            mutation.mutate({ userId: member.id, roleId: event.target.value })
                          }}
                        >
                          <option value="">Seleccionar</option>
                          {roleOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </Form.Select>
                      ) : (
                        ROLE_LABELS[roleFromMember(member) ?? APP_ROLES.soloLectura]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-md-none d-flex flex-column gap-3">
            {membersQuery.data.map((member) => (
              <article className="surface-card p-3" key={member.id}>
                <h3 className="h5 mb-1">{member.full_name}</h3>
                <p className="small text-secondary mb-2">{member.job_title || 'Sin cargo'}</p>
                <p className="small mb-2">{member.is_active ? 'Activo' : 'Inactivo'}</p>
                {canEdit ? (
                  <Form.Select
                    aria-label={`Rol de ${member.full_name}`}
                    value={roleOptions.find((item) => item.code === roleFromMember(member))?.id ?? ''}
                    disabled={mutation.isPending}
                    onChange={(event) => {
                      setError(null)
                      setSuccess(null)
                      if (!event.target.value) {
                        return
                      }
                      mutation.mutate({ userId: member.id, roleId: event.target.value })
                    }}
                  >
                    <option value="">Seleccionar</option>
                    {roleOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <p className="mb-0">{ROLE_LABELS[roleFromMember(member) ?? APP_ROLES.soloLectura]}</p>
                )}
              </article>
            ))}
          </div>
        </>
      ) : null}

      {canEdit ? (
        <p className="small text-secondary mt-3 mb-0">
          Para invitar a alguien: Authentication → Users en Supabase, sin activar el registro
          público. El rol inicial es solo lectura hasta que lo cambies acá.
        </p>
      ) : null}
    </div>
  )
}
