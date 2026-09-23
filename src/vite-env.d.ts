/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_TIMEZONE: string
  readonly VITE_APP_LOCALE: string
  readonly VITE_RUN_HOSTED_SECURITY_PROBE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.sql?raw' {
  const source: string
  export default source
}
