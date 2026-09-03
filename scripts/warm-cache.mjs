// Boot-time cache warm-up. Railway cannot reach the database while
// `next build` runs, so static routes are prerendered empty; this purges
// that build-time cache once the server is up and renders the static routes
// with real data before /api/health starts reporting healthy (see
// src/app/api/health/route.ts). Runs alongside `next start`.
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const port = process.env.PORT || '3000'
const base = `http://127.0.0.1:${port}`
const secret = process.env.REVALIDATE_SECRET
export const WARM_FLAG = process.env.CACHE_WARM_FLAG || path.join(tmpdir(), 'site-cache-warm')

const STATIC_ROUTES = [
  '/',
  '/explore',
  '/blog',
  '/about',
  '/contact',
  '/promote',
  '/privacy-policy',
  '/sitemap.xml',
  '/llms.txt',
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const log = (message) => console.log(`[warm-cache] ${message}`)

// Wait until Next answers and Payload can reach the database
const waitForServer = async () => {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const res = await fetch(`${base}/api/health`)
      const body = await res.json().catch(() => ({}))
      if (body?.ok) return true
    } catch {
      // not listening yet
    }
    await sleep(1000)
  }
  return false
}

const warm = async () => {
  if (!(await waitForServer())) {
    log('server never became ready — giving up')
    return
  }

  if (secret) {
    const res = await fetch(`${base}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
      method: 'POST',
    })
    log(`purged build-time cache (${res.status})`)
  } else {
    log('REVALIDATE_SECRET not set — cannot purge, only pre-rendering')
  }

  // Two passes: the first render after a purge may still serve the stale
  // page while regenerating in the background; the second gets fresh output
  for (let pass = 1; pass <= 2; pass++) {
    for (const route of STATIC_ROUTES) {
      try {
        const res = await fetch(`${base}${route}`, { headers: { 'x-warm-cache': '1' } })
        if (pass === 2) log(`${route} → ${res.status}`)
      } catch (error) {
        log(`${route} failed: ${error instanceof Error ? error.message : error}`)
      }
    }
    if (pass === 1) await sleep(1500)
  }
}

try {
  await warm()
} catch (error) {
  log(`failed: ${error instanceof Error ? error.message : error}`)
} finally {
  // Always release the health gate — a failed warm-up must not block deploys
  await writeFile(WARM_FLAG, new Date().toISOString()).catch(() => undefined)
  log('done')
}
