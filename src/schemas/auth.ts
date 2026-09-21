import { z } from 'zod'

import { APP_ROLES } from '@/config/constants.ts'

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresá un correo válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Ingresá un correo válido.'),
})

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirmá la contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Ingresá tu nombre.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),
  job_title: z.string().trim().max(120, 'El cargo no puede superar 120 caracteres.').optional(),
  phone: z.string().trim().max(40, 'El teléfono no puede superar 40 caracteres.').optional(),
})

export const userRoleSchema = z.object({
  role: z.enum([
    APP_ROLES.administrador,
    APP_ROLES.socio,
    APP_ROLES.colaborador,
    APP_ROLES.soloLectura,
  ]),
})

export type LoginValues = z.infer<typeof loginSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type UserRoleValues = z.infer<typeof userRoleSchema>
