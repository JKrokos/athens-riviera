// Local check for the post publish hooks and the virtual HTML source field.
// Usage: DATABASE_URL=… npx payload run scripts/test-post-hooks.ts
import { getPayload } from 'payload'

import config from '../src/payload.config'

const payload = await getPayload({ config })
const stamp = Date.now()

const created = await payload.create({
  collection: 'posts',
  data: {
    title: `Καλημέρα Αθήνα δοκιμή ${stamp}`,
    publishedAt: null,
    contentHtml:
      '<h2>Heading</h2><p>Η πρώτη παράγραφος του άρθρου έχει αρκετό κείμενο για να γίνει περίληψη αυτόματα από το σύστημα.</p><p>Second paragraph.</p>',
  } as never,
})
console.log('slug:', created.slug)
console.log('excerpt:', created.excerpt)
console.log('publishedAt:', created.publishedAt)
console.log('content children:', (created.content as { root?: { children?: unknown[] } })?.root?.children?.length)
console.log('contentHtml stored?:', 'contentHtml' in created ? (created as unknown as Record<string, unknown>).contentHtml : 'absent')

const duplicated = await payload.duplicate({ collection: 'posts', id: created.id })
console.log('duplicate slug:', duplicated.slug, '| publishedAt:', duplicated.publishedAt)

await payload.delete({ collection: 'posts', id: duplicated.id })
await payload.delete({ collection: 'posts', id: created.id })
console.log('cleaned up')
process.exit(0)
