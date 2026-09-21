import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Offcanvas } from 'react-bootstrap'

import { APP_NAME, APP_TAGLINE } from '@/config/constants.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { isStaffRole, ROLE_LABELS } from '@/features/auth/roles.ts'

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth()
  const items = [
    { to: '/', label: 'Inicio', icon: 'bi-speedometer2', end: true },
    { to: '/ruta', label: 'Ruta del proyecto', icon: 'bi-signpost-split', end: false },
    { to: '/tareas', label: 'Tareas', icon: 'bi-check2-square', end: false },
    { to: '/avances', label: 'Avances', icon: 'bi-journal-text', end: false },
    ...(isStaffRole(role)
      ? [{ to: '/equipo', label: 'Equipo', icon: 'bi-people', end: false }]
      : []),
    { to: '/perfil', label: 'Perfil', icon: 'bi-person', end: false },
  ]

  return (
    <nav aria-label="Principal">
      <ul className="nav flex-column gap-1">
        {items.map((item) => (
          <li className="nav-item" key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2${isActive ? ' active' : ''}`
              }
              onClick={onNavigate}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, user, role, signOut } = useAuth()

  return (
    <div className="app-shell d-flex flex-column flex-lg-row">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>

      <aside className="app-sidebar d-none d-lg-flex flex-column p-4">
        <div className="mb-4">
          <p className="text-uppercase small mb-1 opacity-75">Proyecto interno</p>
          <h1 className="h4 mb-1">{APP_NAME}</h1>
          <p className="small mb-0 opacity-75">{APP_TAGLINE}</p>
        </div>
        <SidebarNav />
        <div className="mt-auto pt-4">
          <p className="small mb-1">{profile?.full_name ?? user?.email ?? 'Usuario'}</p>
          <p className="small opacity-75 mb-3">{role ? ROLE_LABELS[role] : 'Sin rol'}</p>
          <button type="button" className="btn btn-outline-light btn-sm" onClick={() => void signOut()}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-grow-1 app-main d-flex flex-column min-vh-100">
        <header className="d-lg-none border-bottom bg-white px-3 py-3 d-flex align-items-center justify-content-between">
          <div>
            <p className="small text-secondary mb-0">Sapiens Industrial</p>
            <strong>{profile?.full_name ?? user?.email ?? 'Gestión interna'}</strong>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label="Abrir menú de navegación"
            onClick={() => {
              setMenuOpen(true)
            }}
          >
            <i className="bi bi-list fs-5" aria-hidden="true" />
          </button>
        </header>

        <Offcanvas
          show={menuOpen}
          onHide={() => {
            setMenuOpen(false)
          }}
          placement="start"
        >
          <Offcanvas.Header closeButton closeLabel="Cerrar menú">
            <Offcanvas.Title>{APP_NAME}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column">
            <SidebarNav
              onNavigate={() => {
                setMenuOpen(false)
              }}
            />
            <div className="mt-auto pt-4">
              <p className="small mb-2">{role ? ROLE_LABELS[role] : 'Sin rol'}</p>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setMenuOpen(false)
                  void signOut()
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        <main id="contenido-principal" className="flex-grow-1 p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
