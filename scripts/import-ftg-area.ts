// Import a flyingtogreece.com destination guide into an area of this site.
// Usage: FTG_AREA_PAGE=places-in-arachova FTG_AREA_SLUG=arachova \
//        npx payload run scripts/import-ftg-area.ts
import { getPayload } from 'payload'

import { importFlyingToGreeceArea } from '../src/lib/importFlyingToGreece'
import config from '../src/payload.config'

const pageSlug = process.env.FTG_AREA_PAGE || 'places-in-arachova'
const areaSlug = process.env.FTG_AREA_SLUG || 'arachova'

const payload = await getPayload({ config })
const summary = await importFlyingToGreeceArea(payload, (message) => console.log(`[ftg] ${message}`), {
  pageSlug,
  areaSlug,
})
console.log('summary:', summary)
process.exit(0)
