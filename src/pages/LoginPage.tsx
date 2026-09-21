import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { translateAuthError } from '@/features/auth/auth-errors.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { loginSchema, type LoginValues } from '@/schemas/auth.ts'
import { signInWithPassword } from '@/services/auth.ts'

export function LoginPage() {
  const { configured, session, status } = useAuth()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (status !== 'loading' && session) {
    const from = typeof location.state === 'object' && location.state && 'from' in location.state
      ? String(location.state.from)
      : '/'
    return <Navigate to={from || '/'} replace />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)

    if (!configured) {
      setSubmitError('Supabase todavía no está configurado en este entorno.')
      return
    }

    const { error } = await signInWithPassword(values.email, values.password)
    if (error) {
      setSubmitError(translateAuthError(error.message))
    }
  })

  return (
    <>
      <h2 className="h4 mb-3">Iniciar sesión</h2>
      {!configured ? (
        <Alert variant="warning">
          Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local. Creá el proyecto de
          Supabase, aplicá las migraciones y copiá solo la clave anónima. No hay registro público.
        </Alert>
      ) : null}
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
      <Form onSubmit={onSubmit} noValidate>
        <Form.Group className="mb-3" controlId="login-email">
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
        <Form.Group className="mb-3" controlId="login-password">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control
            type="password"
            autoComplete="current-password"
            disabled={!configured || form.formState.isSubmitting}
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <Form.Text className="text-danger">{form.formState.errors.password.message}</Form.Text>
          ) : null}
        </Form.Group>
        <Button type="submit" className="w-100" disabled={!configured || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </Form>
      <p className="small mt-3 mb-0">
        <Link to="/recuperar-contrasena">Olvidé mi contraseña</Link>
      </p>
    </>
  )
}
