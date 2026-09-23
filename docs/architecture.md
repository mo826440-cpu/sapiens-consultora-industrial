# Arquitectura

## Objetivo

Aplicación web interna para administrar y dar seguimiento al proyecto de consultoría Sapiens Industrial hasta el primer caso validado.

No es la página pública para clientes.

## Estilo de aplicación

SPA con Vite. El navegador habla con Supabase. No hay servidor de aplicación propio.

## Capas

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| Páginas | `src/pages` | Pantallas y composición |
| Dominio | `src/features` | Módulos de negocio |
| UI | `src/components` | Componentes reutilizables |
| Datos | `src/services` | Consultas y mutaciones a Supabase |
| Validación | `src/schemas` | Esquemas Zod |
| Infra | `src/lib` | Cliente Supabase, Query Client, fechas |
| Tipos | `src/types` | Tipos generados desde Supabase |

## Stack aprobado

- TypeScript 6, React 19, Vite 8, React Router 8, Bootstrap 5.3, react-bootstrap 2
- TanStack Query 5, React Hook Form 7, Zod 3, Recharts 3, date-fns 4
- Supabase JS 2 y CLI 2 (no se usa el canal beta 3)
- GitHub, Vercel, npm, ESLint 9, Prettier 3, Vitest 5

ESLint quedó en 9 porque `eslint-plugin-jsx-a11y` aún no declara soporte para ESLint 10. Zod quedó en 3 por compatibilidad estable con `@hookform/resolvers`. La accesibilidad se cubre con HTML semántico, foco visible y revisión en navegador.

## Decisiones vigentes

- Un rol por usuario.
- Sin tabla `projects` en el MVP.
- Bootstrap 5 con tema industrial propio.
- Alta inicial de usuarios desde el panel de Supabase; Edge Function de invitación más adelante.
- Avance de etapa: promedio de ítems y tareas, ocho etapas con peso igual.
- Funciones `SECURITY DEFINER`: `SET search_path = ''` y nombres calificados (`public.`, `auth.`, `pg_catalog.`).
- Tabla `notifications` prevista; UI diferida.
- Commits en español con Conventional Commits.

## Entornos

| Entorno | Uso |
| --- | --- |
| Local | Vite +, opcionalmente, Supabase CLI |
| Preview | Vercel preview + proyecto Supabase de desarrollo |
| Producción | Vercel + proyecto Supabase de producción |

Las claves reales no se documentan aquí. Ver `.env.example`.
