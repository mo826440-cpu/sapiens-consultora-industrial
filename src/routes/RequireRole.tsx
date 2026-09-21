import { Navigate, Outlet } from 'react-router'

import { useAuth } from '@/features/auth/auth-context.ts'
import { hasRole } from '@/features/auth/roles.ts'
import type { AppRole } from '@/config/constants.ts'

export function RequireRole({ roles }: { roles: readonly AppRole[] }) {
  const { role, status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="py-5 text-center text-secondary">
        <p className="mb-0">Cargando permisos…</p>
      </div>
    )
  }

  if (!hasRole(role, roles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
