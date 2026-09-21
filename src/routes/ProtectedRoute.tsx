import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/features/auth/auth-context.ts'

export function ProtectedRoute() {
  const { configured, status, session, profile } = useAuth()
  const location = useLocation()

  if (!configured) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  }

  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <p className="text-secondary mb-0">Cargando sesión…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  }

  if (profile && !profile.is_active) {
    return <Navigate to="/cuenta-inactiva" replace />
  }

  return <Outlet />
}
