# Supabase

Carpeta de migraciones, semilla y configuración local.

- `migrations/` es la fuente de verdad ejecutable.
- `config.toml` es de entorno local. `enable_signup` está en `false`.
- `seed.sql` es solo demostración ficticia y no se ejecuta solo (`[db.seed] enabled = false`).
- No hay claves en el repositorio.
- Hosted: `20260920190000`, `20260920220000` y `20260921233000` aplicadas y alineadas.

## Aplicar la Fase 2

1. Crear el proyecto en el panel de Supabase (el titular).
2. Authentication → Providers → Email: desactivar signups.
3. Copiar URL y anon key a `.env.local`.
4. `npx supabase login` y `npx supabase link` (con autorización).
5. `npx supabase db push` (con autorización; incluye migraciones pendientes).
6. Crear el primer usuario en Authentication → Users.
7. Asignar rol administrador con el SQL de `docs/installation-guide.md`.
