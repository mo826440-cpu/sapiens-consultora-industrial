import { Outlet } from 'react-router'

import { APP_NAME, APP_TAGLINE } from '@/config/constants.ts'

export function AuthLayout() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <main className="w-100" style={{ maxWidth: '28rem' }}>
        <div className="text-center mb-4">
          <p className="text-uppercase small text-secondary mb-1">Proyecto interno</p>
          <h1 className="h3 mb-1">{APP_NAME}</h1>
          <p className="text-secondary mb-0">{APP_TAGLINE}</p>
        </div>
        <div className="surface-card p-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
