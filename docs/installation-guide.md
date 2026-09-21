# Guía de instalación

## Requisitos

| Herramienta | Obligatoria | Verificación |
| --- | --- | --- |
| Node.js 22.12+ (recomendado 24 LTS) | Sí | `node -v` |
| npm | Sí | `npm -v` |
| Git | Sí | `git --version` |
| Docker Desktop | Recomendada para Supabase local | `docker version` |
| Cuenta GitHub | Para el remoto | — |
| Cuenta Supabase | Fase 2 | — |
| Cuenta Vercel | Fase 8 | — |

En este equipo Docker no está instalado. Las migraciones se aplican a un proyecto hosted cuando el titular lo cree.

## Arranque local

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Hasta completar `.env.local` con valores reales, la app muestra el inicio de sesión y explica que Supabase no está configurado. No inventa una conexión.

## Fase 2 — Supabase real (el titular)

1. Crear un proyecto en [Supabase](https://supabase.com).
2. Project Settings → API: copiar Project URL y `anon` `public` a `.env.local` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Nunca copiar `service_role` a una variable `VITE_*` ni al frontend.
4. Authentication → Providers → Email: desactivar “Allow new users to sign up”.
5. Authentication → URL Configuration:
   - Site URL: `http://127.0.0.1:5173` en desarrollo.
   - Redirect URLs: `http://127.0.0.1:5173/actualizar-contrasena` y, más adelante, las de Vercel.
6. Aplicar migraciones (con autorización expresa):

```bash
npx supabase login
npx supabase link
npx supabase db push
```

7. Authentication → Users → Add user: crear el primer usuario (correo y contraseña). No uses datos de clientes reales.
8. En SQL Editor, asignar administrador. Reemplazá solo el correo:

```sql
update public.user_roles
set role_id = (select id from public.roles where code = 'administrador')
where user_id = (
  select id from auth.users where email = 'CORREO_DEL_ADMIN'
);
```

Los usuarios siguientes quedan en `solo_lectura` hasta que un administrador los cambie en Equipo.

## Fase 3 — Etapas, tareas, hitos y avances

Sin Docker no se puede hacer `supabase db push` desde esta máquina. En el SQL Editor del proyecto hosted:

1. Abrí `supabase/migrations/20260920220000_stages_tasks_milestones_progress.sql`.
2. Copiá todo el archivo.
3. Pegalo en SQL Editor → New query → Run.
4. Recargá la app. Ruta debe mostrar las ocho etapas; Tareas y Avances quedan vacíos hasta que cargues trabajo.

Si el SQL Editor avisa que un tipo o tabla ya existe, no reejecutes el archivo completo: esa migración ya está aplicada.

## Scripts

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest |
| `npm run build` | Build de producción |
| `npm run gen:types` | Regenerar tipos desde Supabase local |

## Regenerar tipos

Cuando exista stack local:

```bash
npm run gen:types
```

Si solo hay proyecto hosted (con autorización):

```bash
npx supabase gen types typescript --project-id <id-del-proyecto> > src/types/database.types.ts
```
