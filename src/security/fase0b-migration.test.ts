import { describe, expect, it } from 'vitest'

import authSql from '../../supabase/migrations/20260920190000_auth_profiles_roles.sql?raw'
import trackingSql from '../../supabase/migrations/20260920220000_stages_tasks_milestones_progress.sql?raw'
import correctiveSql from '../../supabase/migrations/20260921233000_secure_function_execute_privileges.sql?raw'
import {
  POLICY_HELPER_FUNCTIONS,
  SECURITY_DEFINER_FUNCTIONS,
  TRIGGER_FUNCTIONS,
} from '@/security/function-privilege-matrix.ts'

function functionBlock(sql: string, name: string) {
  const pattern = new RegExp(
    `create or replace function public\\.${name}[\\s\\S]*?as \\$\\$[\\s\\S]*?\\$\\$;`,
    'i',
  )
  const match = sql.match(pattern)
  if (!match) {
    throw new Error(`No se encontró la función public.${name} en la migración correctiva.`)
  }
  return match[0]
}

describe('migración correctiva 20260921233000', () => {
  const sql = correctiveSql

  it('existe junto a las dos migraciones originales sin reemplazarlas', () => {
    expect(authSql.length).toBeGreaterThan(100)
    expect(trackingSql.length).toBeGreaterThan(100)
    expect(sql).toContain('Fase 0b')
    expect(sql).not.toMatch(/drop table/i)
    expect(sql).not.toMatch(/alter policy/i)
  })

  it('no usa search_path = public', () => {
    expect(sql).not.toMatch(/set search_path\s*=\s*public/i)
  })

  it('define search_path vacío en cada SECURITY DEFINER y en set_updated_at', () => {
    for (const name of SECURITY_DEFINER_FUNCTIONS) {
      const block = functionBlock(sql, name)
      expect(block).toMatch(/security definer/i)
      expect(block).toMatch(/set search_path\s*=\s*''/)
    }

    const updatedAt = functionBlock(sql, 'set_updated_at')
    expect(updatedAt).not.toMatch(/security definer/i)
    expect(updatedAt).toMatch(/set search_path\s*=\s*''/)
    expect(updatedAt).toContain('pg_catalog.now()')
  })

  it('califica esquema y objetos usados por el recálculo y los helpers', () => {
    const recalculate = functionBlock(sql, 'recalculate_stage_progress')
    expect(recalculate).toContain('public.can_write_project()')
    expect(recalculate).toContain('public.stage_items')
    expect(recalculate).toContain('public.tasks')
    expect(recalculate).toContain('public.project_stages')
    expect(recalculate).toContain('auth.uid()')
    expect(recalculate).toContain('pg_catalog.count')
    expect(recalculate).toContain('pg_catalog.round')
    expect(recalculate).toContain('pg_catalog.avg')
    expect(recalculate).toMatch(/errcode = '42501'/)

    const editTask = functionBlock(sql, 'can_edit_task')
    expect(editTask).toContain('public.tasks')
    expect(editTask).toContain('public.task_assignees')
    expect(editTask).toContain('public.is_active_user()')
    expect(editTask).toContain('public.is_staff()')
  })

  it('normaliza helpers booleanos con coalesce a false', () => {
    for (const name of ['is_admin', 'is_staff', 'can_write_project', 'can_edit_task', 'is_active_user']) {
      const block = functionBlock(sql, name)
      expect(block.toLowerCase()).toContain('coalesce(')
      expect(block.toLowerCase()).not.toContain('pg_catalog.coalesce')
      expect(block.toLowerCase()).toContain('false')
    }
  })

  it('revoca EXECUTE a PUBLIC y anon en funciones sensibles', () => {
    for (const name of [...TRIGGER_FUNCTIONS, ...POLICY_HELPER_FUNCTIONS]) {
      expect(sql.toLowerCase()).toMatch(
        new RegExp(`revoke all on function public\\.${name}[^;]*from public, anon`),
      )
    }
  })

  it('otorga EXECUTE a authenticated solo en helpers y recálculo', () => {
    for (const name of POLICY_HELPER_FUNCTIONS) {
      expect(sql.toLowerCase()).toMatch(
        new RegExp(`grant execute on function public\\.${name}[^;]*to authenticated`),
      )
    }

    for (const name of TRIGGER_FUNCTIONS) {
      expect(sql.toLowerCase()).toMatch(
        new RegExp(`revoke all on function public\\.${name}[^;]*authenticated`),
      )
      expect(sql.toLowerCase()).not.toMatch(
        new RegExp(`grant execute on function public\\.${name}[^;]*to authenticated`),
      )
    }
  })

  it('no cambia la fórmula de avance: ítems, tareas y promedio simple', () => {
    const recalculate = functionBlock(sql, 'recalculate_stage_progress')
    expect(recalculate).toMatch(/items_done::numeric \/ items_total::numeric/)
    expect(recalculate).toMatch(/status = 'finalizada' then 100/)
    expect(recalculate).toMatch(/\(items_percent \+ tasks_percent\) \/ 2/)
    expect(recalculate).not.toMatch(/peso|weight|hito|milestone/i)
  })
})
