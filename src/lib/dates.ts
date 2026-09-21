import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/config/constants.ts'

function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return value
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
  }

  return parseISO(value)
}

export function formatDateAR(value: Date | string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = toDate(value)
  if (!isValid(date)) {
    return '—'
  }

  return format(date, 'dd/MM/yyyy', { locale: es })
}

export function formatDateTimeAR(value: Date | string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = toDate(value)
  if (!isValid(date)) {
    return '—'
  }

  return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
}

export function getAppLocale(): string {
  return import.meta.env.VITE_APP_LOCALE || DEFAULT_LOCALE
}

export function todayInCordoba(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE })
}
