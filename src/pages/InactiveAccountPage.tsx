import { useAuth } from '@/features/auth/auth-context.ts'

export function InactiveAccountPage() {
  const { signOut, profile } = useAuth()

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <main className="surface-card p-4" style={{ maxWidth: '28rem' }}>
        <h1 className="h4">Cuenta inactiva</h1>
        <p className="text-secondary">
          {profile?.full_name ? `${profile.full_name}, tu` : 'Tu'} acceso está desactivado. Pedile a
          un administrador que lo revise.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => void signOut()}>
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}
