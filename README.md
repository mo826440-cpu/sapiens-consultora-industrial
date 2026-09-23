# Sapiens Industrial — Gestión interna

Aplicación web interna para registrar avances, organizar tareas y seguir el proyecto de consultoría hasta el **primer caso validado**.

No es la página pública para clientes.

## Stack

React 19, TypeScript, Vite, Bootstrap 5, TanStack Query y Supabase.

## Requisitos

- Node.js 22.12 o superior (recomendado 24 LTS)
- npm
- Git

## Inicio rápido

```bash
npm install
copy .env.example .env.local
npm run dev
```

Hasta que exista un proyecto Supabase real, dejá los placeholders. La app pide iniciar sesión y no simula indicadores como si fueran datos productivos.

## Calidad

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Instalación](docs/installation-guide.md)
- [Hoja de ruta](docs/project-roadmap.md)
- [Esquema Supabase](docs/supabase-schema.md)
- [Seguridad y RLS](docs/security-and-rls.md)
- [Despliegue](docs/deployment.md)

## Fase actual

Fases 0 a 3 y 0b hechas y aplicadas en hosted. Las tres migraciones están alineadas. Ver [instalación](docs/installation-guide.md) y [seguridad](docs/security-and-rls.md).
