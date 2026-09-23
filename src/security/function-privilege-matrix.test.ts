import { describe, expect, it } from 'vitest'

import {
  ACTORS,
  FUNCTION_PRIVILEGE_MATRIX,
  POLICY_HELPER_FUNCTIONS,
} from '@/security/function-privilege-matrix.ts'

describe('matriz de privilegios de funciones (Fase 0b)', () => {
  it('cubre anónimo, inactivo, solo lectura, colaborador, socio y administrador', () => {
    expect(FUNCTION_PRIVILEGE_MATRIX.map((row) => row.actor)).toEqual([...ACTORS])
  })

  it('impide a anonimo e inactivo escribir avance, y a solo_lectura también', () => {
    for (const actor of ['anonimo', 'inactivo', 'solo_lectura'] as const) {
      const row = FUNCTION_PRIVILEGE_MATRIX.find((item) => item.actor === actor)
      expect(row?.recalculate_stage_progress.writesProgress).toBe(false)
    }
  })

  it('niega EXECUTE de helpers y recálculo al rol anon de PostgREST', () => {
    const anon = FUNCTION_PRIVILEGE_MATRIX.find((row) => row.actor === 'anonimo')
    expect(anon).toBeDefined()
    for (const helper of POLICY_HELPER_FUNCTIONS) {
      if (helper === 'recalculate_stage_progress') {
        expect(anon?.recalculate_stage_progress.execute).toBe(false)
        continue
      }
      expect(anon?.helpers[helper as keyof typeof anon.helpers].execute).toBe(false)
    }
    expect(anon?.triggerRpcs.execute).toBe(false)
  })

  it('permite recálculo con escritura solo a colaborador, socio y administrador activos', () => {
    const writers = FUNCTION_PRIVILEGE_MATRIX.filter((row) => row.recalculate_stage_progress.writesProgress)
    expect(writers.map((row) => row.actor)).toEqual(['colaborador', 'socio', 'administrador'])
    expect(writers.every((row) => row.isActive && row.helpers.can_write_project.returns === true)).toBe(
      true,
    )
  })

  it('mantiene los RPC de triggers fuera de authenticated y anon', () => {
    expect(FUNCTION_PRIVILEGE_MATRIX.every((row) => row.triggerRpcs.execute === false)).toBe(true)
  })

  it('devuelve false (no null) en is_admin e is_staff para actores no privilegiados que sí pueden ejecutar', () => {
    for (const actor of ['inactivo', 'solo_lectura', 'colaborador'] as const) {
      const row = FUNCTION_PRIVILEGE_MATRIX.find((item) => item.actor === actor)
      expect(row?.helpers.is_admin.returns).toBe(false)
      expect(row?.helpers.is_staff.returns).toBe(false)
    }
  })
})
