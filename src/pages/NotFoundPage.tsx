import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="container-fluid px-0">
      <h2 className="h3">Página no encontrada</h2>
      <p className="text-secondary">La ruta solicitada no existe en la aplicación interna.</p>
      <Link className="btn btn-primary" to="/">
        Volver al inicio
      </Link>
    </div>
  )
}
