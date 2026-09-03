import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayloadClient } from '../../../lib/payloadClient'

export const dynamic = 'force-dynamic'

// Static routes are prerendered empty at build time (no database access on
// Railway builds); scripts/warm-cache.mjs re-renders them at boot and then
// drops this flag. Until then the instance reports unhealthy so the platform
// keeps traffic on the previous deployment. The time limit guarantees a
// deploy can never hang on a broken warm-up.
const WARM_FLAG = process.env.CACHE_WARM_FLAG || path.join(tmpdir(), 'site-cache-warm')
const WARM_GRACE_SECONDS = 150

const cacheWarm = (): boolean => existsSync(WARM_FLAG) || process.uptime() > WARM_GRACE_SECONDS

export async function GET(): Promise<Response> {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users' })
    const warm = cacheWarm()
    return Response.json({ ok: true, warm }, { status: warm ? 200 : 503 })
  } catch (error) {
    return Response.json(
      { ok: false, warm: cacheWarm(), error: error instanceof Error ? error.message : 'unknown' },
      { status: 503 },
    )
  }
}
