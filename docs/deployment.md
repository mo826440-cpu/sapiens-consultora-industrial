# Despliegue

## Vercel

La aplicación es una SPA. El archivo `vercel.json` reescribe las rutas al `index.html` para evitar 404 al recargar.

Build previsto:

- Framework: Vite
- Comando: `npm run build`
- Directorio de salida: `dist`
- Versión de Node: 22 o 24 LTS

## Variables en Vercel

Configurar en Production (y Preview si se usan PRs). Valores reales, nunca documentados aquí:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_TIMEZONE` = `America/Argentina/Cordoba`
- `VITE_APP_LOCALE` = `es-AR`

No cargar `service_role` en Vercel. Esas variables `VITE_*` quedan en el bundle del navegador: solo URL y clave `anon`/`publishable`.

## Dominio gratuito

Vercel asigna `https://<proyecto>.vercel.app` sin costo. Ese es el dominio para entrar desde la web.

Después del primer deploy, en Supabase → Authentication → URL Configuration agregar:

- Site URL: `https://<proyecto>.vercel.app`
- Redirect URLs:
  - `https://<proyecto>.vercel.app/**`
  - `https://<proyecto>.vercel.app/actualizar-contrasena`
  - `http://127.0.0.1:5173/actualizar-contrasena` (desarrollo)
  - `http://localhost:5173/actualizar-contrasena` (desarrollo)

Mantener “Allow new users to sign up” desactivado.

## Entornos

| Entorno | Cuándo |
| --- | --- |
| Preview | Cada PR, cuando exista GitHub conectado |
| Production | Rama `main` |

## Publicación

El remoto previsto es el repositorio de GitHub del titular. No se hace push ni deploy sin autorización expresa.
