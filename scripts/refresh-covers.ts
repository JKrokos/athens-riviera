// Re-pick every category/area cover and the homepage hero from the media
// library. Usage: DATABASE_URL=… npx payload run scripts/refresh-covers.ts
import { getPayload } from 'payload'

import { assignTaxonomyImages, refreshHomepageHero } from '../src/lib/importer'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const log = (message: string) => console.log(`[covers] ${message}`)
console.log(await assignTaxonomyImages(payload, log, { refresh: true }))
await refreshHomepageHero(payload, log)
process.exit(0)
