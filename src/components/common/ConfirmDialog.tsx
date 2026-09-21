import { Button, Modal } from 'react-bootstrap'

type ConfirmDialogProps = {
  show: boolean
  title: string
  message: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  busy?: boolean
}

export function ConfirmDialog({
  show,
  title,
  message,
  confirmLabel = 'Eliminar',
  onCancel,
  onConfirm,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton closeLabel="Cerrar">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
