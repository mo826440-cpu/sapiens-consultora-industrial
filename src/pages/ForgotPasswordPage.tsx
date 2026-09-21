import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { translateAuthError } from '@/features/auth/auth-errors.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/schemas/auth.ts'
import { requestPasswordReset } from '@/services/auth.ts'

export function ForgotPasswordPage() {
  const { configured } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setSuccess(false)

    if (!configured) {
      setSubmitError('Supabase todavía no está configurado en este entorno.')
      return
    }

    const { error } = await requestPasswordReset(values.email)
    if (error) {
      setSubmitError(translateAuthError(error.message))
      return
    }

    setSuccess(true)
  })

  return (
    <>
      <h2 className="h4 mb-3">Recuperar contraseña</h2>
      <p className="text-secondary">
        Si el correo está asociado a un usuario, vas a recibir instrucciones. El alta de cuentas la
        hace un administrador; no hay registro público.
      </p>
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
      {success ? (
        <Alert variant="success">
          Si el correo está registrado, vas a recibir un mensaje para elegir una nueva contraseña.
        </Alert>
      ) : null}
      <Form onSubmit={onSubmit} noValidate>
        <Form.Group className="mb-3" controlId="recover-email">
          <Form.Label>Correo</Form.Label>
          <Form.Control
            type="email"
            autoComplete="email"
            disabled={!configured || form.formState.isSubmitting}
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <Form.Text className="text-danger">{form.formState.errors.email.message}</Form.Text>
          ) : null}
        </Form.Group>
        <Button type="submit" className="w-100" disabled={!configured || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Enviando…' : 'Enviar instrucciones'}
        </Button>
      </Form>
      <p className="small mt-3 mb-0">
        <Link to="/iniciar-sesion">Volver al inicio de sesión</Link>
      </p>
    </>
  )
}
