// One-off runner: assign category/area cover images from listing galleries.
// Usage: npx payload run scripts/assign-taxonomy-images.ts
import { getPayload } from 'payload'

import { assignTaxonomyImages } from '../src/lib/importer'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const result = await assignTaxonomyImages(payload, (message) => console.log(`[tax] ${message}`))
console.log('result:', result)
process.exit(0)
