import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form } from 'react-bootstrap'

import { ROLE_LABELS } from '@/features/auth/roles.ts'
import { useAuth } from '@/features/auth/auth-context.ts'
import { profileSchema, type ProfileValues } from '@/schemas/auth.ts'
import { updateOwnProfile } from '@/services/auth.ts'
import { translateAuthError } from '@/features/auth/auth-errors.ts'

export function ProfilePage() {
  const { user, profile, role, refresh } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name ?? '',
      job_title: profile?.job_title ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setSuccess(false)

    const { error } = await updateOwnProfile({
      full_name: values.full_name,
      job_title: values.job_title,
      phone: values.phone,
    })

    if (error) {
      setSubmitError(translateAuthError(error.message))
      return
    }

    await refresh()
    setSuccess(true)
  })

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '40rem' }}>
      <p className="text-secondary mb-1">Cuenta</p>
      <h2 className="h3 mb-4">Perfil</h2>
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
      {success ? <Alert variant="success">Los datos del perfil se guardaron.</Alert> : null}

      <section className="surface-card p-3 p-md-4 mb-3">
        <h3 className="h5 mb-3">Identidad</h3>
        <p className="mb-1">
          <span className="text-secondary">Correo: </span>
          {user?.email ?? '—'}
        </p>
        <p className="mb-0">
          <span className="text-secondary">Rol: </span>
          {role ? ROLE_LABELS[role] : 'Sin rol asignado'}
        </p>
      </section>

      <section className="surface-card p-3 p-md-4">
        <h3 className="h5 mb-3">Datos visibles</h3>
        <Form onSubmit={onSubmit} noValidate>
          <Form.Group className="mb-3" controlId="profile-name">
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" autoComplete="name" {...form.register('full_name')} />
            {form.formState.errors.full_name ? (
              <Form.Text className="text-danger">{form.formState.errors.full_name.message}</Form.Text>
            ) : null}
          </Form.Group>
          <Form.Group className="mb-3" controlId="profile-title">
            <Form.Label>Cargo</Form.Label>
            <Form.Control type="text" {...form.register('job_title')} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="profile-phone">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control type="tel" autoComplete="tel" {...form.register('phone')} />
          </Form.Group>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Form>
      </section>
    </div>
  )
}
