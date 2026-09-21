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
- `public.recalculate_stage_progress(uuid)`

Toda función `SECURITY DEFINER` usa `search_path = public`. `current_app_role` se define así para no entrar en recursión de RLS al leer `user_roles`.

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

## Pendiente

- Pruebas de RLS contra un proyecto real o stack local (requiere Docker o hosted).
- Edge Function de invitación, si se quiere dejar de usar el panel.
- Políticas de documentos, decisiones, CRM y web (Fases 5 a 7).
