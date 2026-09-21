export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'El correo o la contraseña no son correctos.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'El correo todavía no fue confirmado.'
  }

  if (normalized.includes('user already registered')) {
    return 'Ese correo ya tiene un usuario. Pedile a un administrador que revise el acceso.'
  }

  if (normalized.includes('password')) {
    return 'La contraseña no cumple los requisitos. Usá al menos 8 caracteres.'
  }

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Hay demasiados intentos. Esperá un momento y volvé a probar.'
  }

  return 'No se pudo completar la operación. Intentá de nuevo o consultá a un administrador.'
}
