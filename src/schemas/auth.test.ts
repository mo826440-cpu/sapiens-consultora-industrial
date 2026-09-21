import { describe, expect, it } from 'vitest'

import { translateAuthError } from '@/features/auth/auth-errors.ts'
import { canEditTask, canWriteProject, hasRole, isAdminRole, isStaffRole } from '@/features/auth/roles.ts'
import { loginSchema, profileSchema, updatePasswordSchema } from '@/schemas/auth.ts'

describe('loginSchema', () => {
  it('rechaza un correo inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-correo', password: 'secreto12' })
    expect(result.success).toBe(false)
  })

  it('acepta credenciales con formato válido', () => {
    const result = loginSchema.safeParse({
      email: 'socio@example.com',
      password: 'secreto12',
    })
    expect(result.success).toBe(true)
  })
})

describe('updatePasswordSchema', () => {
  it('exige que las contraseñas coincidan', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'secreto12',
      confirmPassword: 'otra-clave',
    })
    expect(result.success).toBe(false)
  })
})

describe('profileSchema', () => {
  it('exige un nombre', () => {
    const result = profileSchema.safeParse({ full_name: 'A' })
    expect(result.success).toBe(false)
  })
})

describe('roles', () => {
  it('distingue staff y administrador', () => {
    expect(isStaffRole('socio')).toBe(true)
    expect(isAdminRole('socio')).toBe(false)
    expect(hasRole('colaborador', ['colaborador', 'administrador'])).toBe(true)
    expect(hasRole(null, ['administrador'])).toBe(false)
    expect(canWriteProject('colaborador')).toBe(true)
    expect(canWriteProject('solo_lectura')).toBe(false)
    expect(
      canEditTask('colaborador', 'u1', { owner_id: null, created_by: 'u1' }, []),
    ).toBe(true)
    expect(
      canEditTask('colaborador', 'u1', { owner_id: 'otro', created_by: 'otro' }, []),
    ).toBe(false)
  })
})

describe('translateAuthError', () => {
  it('traduce credenciales inválidas', () => {
    expect(translateAuthError('Invalid login credentials')).toMatch(/correo o la contraseña/i)
  })
})
