import { describe, expect, it } from 'vitest'

const probeEnabled = import.meta.env.VITE_RUN_HOSTED_SECURITY_PROBE === '1'

describe.skipIf(!probeEnabled)(
  'sonda hosted de RPC (activar con VITE_RUN_HOSTED_SECURITY_PROBE=1)',
  () => {
    it('anon no puede ejecutar recalculate_stage_progress ni helpers', async () => {
      const base = import.meta.env.VITE_SUPABASE_URL
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

      expect(base).toBeTruthy()
      expect(anon).toBeTruthy()
      expect(base).not.toContain('your-project')

      const headers = {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }

      const endpoints = [
        {
          path: '/rest/v1/rpc/recalculate_stage_progress',
          body: { p_stage_id: '00000000-0000-0000-0000-000000000000' },
        },
        { path: '/rest/v1/rpc/can_write_project', body: {} },
        { path: '/rest/v1/rpc/is_admin', body: {} },
        { path: '/rest/v1/rpc/is_staff', body: {} },
        { path: '/rest/v1/rpc/is_active_user', body: {} },
        { path: '/rest/v1/rpc/current_app_role', body: {} },
      ]

      for (const endpoint of endpoints) {
        const response = await fetch(`${base}${endpoint.path}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(endpoint.body),
        })

        expect(response.status, endpoint.path).not.toBe(200)
        expect([401, 403, 404]).toContain(response.status)
      }
    })
  },
)
