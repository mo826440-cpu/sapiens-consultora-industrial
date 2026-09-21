import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { translateAuthError } from '@/features/auth/auth-errors.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { updatePasswordSchema, type UpdatePasswordValues } from '@/schemas/auth.ts'
import { updatePassword } from '@/services/auth.ts'

export function UpdatePasswordPage() {
  const { configured, session, status } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  if (!configured) {
    return <Navigate to="/iniciar-sesion" replace />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)

    const { error } = await updatePassword(values.password)
    if (error) {
      setSubmitError(translateAuthError(error.message))
      return
    }

    setSuccess(true)
  })

  return (
    <>
      <h2 className="h4 mb-3">Nueva contraseña</h2>
      {status === 'loading' ? <p className="text-secondary">Verificando el enlace…</p> : null}
      {!session && status === 'ready' ? (
        <Alert variant="warning">
          Este enlace no es válido o ya expiró. Solicitá una nueva recuperación.
        </Alert>
      ) : null}
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
      {success ? (
        <Alert variant="success">
          La contraseña se actualizó. Ya podés entrar con la nueva clave.
        </Alert>
      ) : null}
      <Form onSubmit={onSubmit} noValidate>
        <Form.Group className="mb-3" controlId="new-password">
          <Form.Label>Contraseña nueva</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            disabled={!session || form.formState.isSubmitting || success}
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <Form.Text className="text-danger">{form.formState.errors.password.message}</Form.Text>
          ) : null}
        </Form.Group>
        <Form.Group className="mb-3" controlId="confirm-password">
          <Form.Label>Confirmación</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            disabled={!session || form.formState.isSubmitting || success}
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword ? (
            <Form.Text className="text-danger">
              {form.formState.errors.confirmPassword.message}
            </Form.Text>
          ) : null}
        </Form.Group>
        <Button
          type="submit"
          className="w-100"
          disabled={!session || form.formState.isSubmitting || success}
        >
          {form.formState.isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </Form>
      <p className="small mt-3 mb-0">
        <Link to="/iniciar-sesion">Ir al inicio de sesión</Link>
      </p>
    </>
  )
}
