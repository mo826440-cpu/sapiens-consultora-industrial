# Historial de cambios del esquema

La fuente ejecutable es `supabase/migrations/`.

| Fecha | Migración | Resumen |
| --- | --- | --- |
| 2026-09-22 | `20260921233000_secure_function_execute_privileges.sql` | Fase 0b aplicada en hosted: `search_path` vacío, REVOKE EXECUTE a PUBLIC/anon, guarda `can_write_project`. Tres migraciones alineadas. Sonda hosted y prueba funcional de administrador OK. |
| 2026-09-20 | `20260920220000_stages_tasks_milestones_progress.sql` | Enums de etapa/tarea/hito, tablas de seguimiento, semilla de 8 etapas + 24 ítems, `can_write_project`, `can_edit_task`, `recalculate_stage_progress`, RLS. |
| 2026-09-20 | `20260920190000_auth_profiles_roles.sql` | Enum `app_role`, tablas `profiles`, `roles`, `user_roles`, `app_settings`, helpers RLS, trigger de perfil al alta, sin registro público. |
| 2026-09-19 | — | Fase 1: sin migraciones. |

Cuando se cree, altere o elimine un objeto de Supabase, agregar una fila aquí en la misma tarea.
