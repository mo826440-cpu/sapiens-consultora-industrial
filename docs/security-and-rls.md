# Seguridad y Row Level Security

## Principios

- RLS en todas las tablas expuestas.
- Un rol por usuario: `administrador`, `socio`, `colaborador`, `solo_lectura`.
- El frontend no es la frontera de autorización.
- Solo `anon` + JWT de usuario en el navegador.
- `service_role` únicamente en Edge Functions o tareas de servidor, nunca en el cliente.
- Sin registro público.
- Storage privado.

## Variables

El cliente puede leer únicamente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Esas claves no se versionan. `.env.example` tiene placeholders.

## Matriz de permisos prevista

| Recurso | Administrador | Socio | Colaborador | Solo lectura |
| --- | --- | --- | --- | --- |
| Lectura general del proyecto | Sí | Sí | Sí | Sí |
| Usuarios y roles | CRUD | Lectura | No | No |
| Ajustes (`app_settings`) | CRUD | Lectura | Lectura | Lectura |
| Etapas, ítems, hitos | CRUD | CRUD | Edición limitada | Lectura |
| Tareas y comentarios | CRUD | CRUD | Propios o asignados | Lectura |
| Avances y decisiones | CRUD | CRUD | Crear/editar propios | Lectura |
| Documentos y adjuntos | CRUD | CRUD | Crear/editar propios | Lectura |
| CRM y reuniones | CRUD | CRUD | CRUD operativo | Lectura |
| `audit_logs` | Lectura | Lectura | No | No |
| Borrado | Sí | Sí, con confirmación | Solo propios acotados | No |

Usuarios con `profiles.is_active = false` no escriben.

## Helpers implementados

- `public.is_active_user()`
- `public.current_app_role()`
- `public.is_admin()`
- `public.is_staff()`
- Trigger `handle_new_user` al insertar en `auth.users` (perfil + rol `solo_lectura`)
- Trigger `set_updated_at`
- Trigger `protect_profile_privileges`
- `public.can_write_project()` (usuario activo con rol administrador, socio o colaborador)
- `public.can_edit_task(uuid)` (staff, responsable, creador o asignado; exige usuario activo)
- `public.recalculate_stage_progress(uuid)` (exige `can_write_project` antes de escribir)

Toda función `SECURITY DEFINER` usa `SET search_path = ''` y referencias calificadas (`public.*`, `auth.uid()`, `pg_catalog.*`). Así se evita que un atacante intercepte `now()`, `count()` u otras funciones vía `search_path`. `current_app_role` sigue siendo DEFINER para no entrar en recursión de RLS al leer `user_roles`. `is_admin`, `is_staff`, `can_write_project`, `can_edit_task` e `is_active_user` devuelven `false` (nunca `null`) cuando no hay privilegio.

`set_updated_at` no es DEFINER (corre como el usuario que actualiza la fila). También usa `search_path` vacío y `pg_catalog.now()`.

## Políticas implementadas (Fase 2)

Migración: `supabase/migrations/20260920190000_auth_profiles_roles.sql`.

`anon` no tiene permisos sobre estas tablas. `authenticated` tiene GRANT; RLS filtra.

| Tabla | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | Propio, o todos si el usuario está activo | Solo trigger `handle_new_user` | Propio si activo, o administrador. Un no admin no cambia `is_active` | No |
| `roles` | Usuario activo | No | No | No |
| `user_roles` | Usuario activo | Administrador | Administrador | Administrador |
| `app_settings` | Usuario activo | No (fila inicial en la migración) | Administrador | No |

## Auth

- Email y contraseña.
- `enable_signup = false` en `supabase/config.toml` y debe replicarse en el panel hosted.
- Recuperación nativa. Redirect: `/actualizar-contrasena`.
- Alta de usuarios: panel de Supabase. Rol inicial: `solo_lectura`.
- El frontend no usa `service_role`.

## Storage

Pendiente de Fase 5.

## Políticas implementadas (Fase 3)

Migración: `supabase/migrations/20260920220000_stages_tasks_milestones_progress.sql`.

`anon` no tiene permisos. `authenticated` tiene GRANT; RLS filtra. FORCE RLS en todas estas tablas.

| Tabla | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `project_stages` | Usuario activo | No (semilla en la migración) | Staff | No |
| `stage_items` | Usuario activo | No (semilla) | `can_write_project` | No |
| `tasks` | Usuario activo | `can_write_project` | `can_edit_task` | Staff |
| `task_assignees` | Usuario activo | `can_edit_task` | No | `can_edit_task` |
| `task_dependencies` | Usuario activo | `can_edit_task` | No | `can_edit_task` |
| `task_comments` | Usuario activo | `can_write_project` | Autor o staff | Autor o staff |
| `milestones` | Usuario activo | `can_write_project` | `can_write_project` | Staff |
| `progress_updates` | Usuario activo | `can_write_project` | Autor o staff | Autor o staff |
| `progress_update_tasks` | Usuario activo | `can_write_project` | No | `can_write_project` |

`vencida` no se guarda: se calcula en la UI si `due_date` es anterior a hoy y el estado no es `finalizada`.

## Correctiva Fase 0b (funciones)

Migración: `supabase/migrations/20260921233000_secure_function_execute_privileges.sql`.

Estado: **aplicada en hosted** el 2026-09-22 (`npx supabase db push`). Las tres migraciones (`20260920190000`, `20260920220000`, `20260921233000`) están alineadas en local y remoto. La vulnerabilidad de EXECUTE público quedó corregida: `anon` ya no obtiene HTTP 200 en los RPC protegidos (sonda hosted en verde). La prueba funcional como administrador (login, ruta, detalle, checklist y recálculo) fue exitosa.

### Hallazgo

`recalculate_stage_progress` es `SECURITY DEFINER` y escribía `project_stages` sin comprobar rol. `EXECUTE` quedó disponible para `PUBLIC`/`anon`. Un cliente sin sesión obtuvo HTTP 200 al invocar el RPC.

### Contrato de EXECUTE

| Función | PUBLIC | anon | authenticated |
| --- | --- | --- | --- |
| `is_active_user`, `current_app_role`, `is_admin`, `is_staff`, `can_write_project`, `can_edit_task`, `recalculate_stage_progress` | REVOKE | REVOKE | GRANT |
| `set_updated_at`, `protect_profile_privileges`, `handle_new_user` | REVOKE | REVOKE | REVOKE (solo triggers) |

El recálculo, además del GRANT, hace `RAISE` `42501` si `not public.can_write_project()`. Un `solo_lectura` o un usuario inactivo autenticado no escribe `progress_percent`. Admin, socio y colaborador activos sí, como la UI actual.

Los helpers DEFINER leen con `auth.uid()`: no consultan ni modifican filas de otros usuarios salvo el recálculo sobre la etapa indicada, y solo si hay permiso de escritura.

### Matriz de actores (funciones)

| Actor | Helpers RPC | Recálculo (escribe) | Triggers como RPC |
| --- | --- | --- | --- |
| Anónimo (`anon`) | No | No | No |
| Autenticado inactivo | Sí; booleanos en `false` | Llama y recibe `42501`; no escribe | No |
| Solo lectura | Sí; `can_write_project` = false | `42501`; no escribe | No |
| Colaborador activo | Sí | Sí | No |
| Socio activo | Sí | Sí | No |
| Administrador activo | Sí | Sí | No |

### Consultas de verificación (después de aplicar)

```sql
select
  p.proname,
  p.prosecdef as security_definer,
  pg_get_function_identity_arguments(p.oid) as args,
  p.proconfig as search_path_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'set_updated_at',
    'protect_profile_privileges',
    'handle_new_user',
    'is_active_user',
    'current_app_role',
    'is_admin',
    'is_staff',
    'can_write_project',
    'can_edit_task',
    'recalculate_stage_progress'
  )
order by p.proname;

select
  p.proname,
  r.rolname,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.proname in (
    'recalculate_stage_progress',
    'can_write_project',
    'is_admin',
    'handle_new_user',
    'set_updated_at'
  )
  and r.rolname in ('anon', 'authenticated')
order by p.proname, r.rolname;
```

Esperado: `proconfig` con `search_path=`. `anon` sin EXECUTE. `authenticated` con EXECUTE en recálculo y helpers, no en `handle_new_user` ni `set_updated_at`.

Sonda desde la app (no corre en `npm test` salvo que se pida): `VITE_RUN_HOSTED_SECURITY_PROBE=1 npm test`.

## Pendiente

- Sonda live: `VITE_RUN_HOSTED_SECURITY_PROBE=1 npm test` (desactivada por defecto; pasó el 2026-09-22).
- Pruebas de RLS de tablas contra stack local (requiere Docker).
- Edge Function de invitación, si se quiere dejar de usar el panel.
- Políticas de documentos, decisiones, CRM y web (Fases 5 a 7).
- Ajuste de RLS de ítems/hitos para colaborador (solo propios o asignados): fase posterior.
