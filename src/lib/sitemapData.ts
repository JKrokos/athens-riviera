import { getPayloadClient } from './payloadClient'

export { getAllCategories, getAreas } from './data'

type Entry = { slug: string; updatedAt: string }

export const getPayloadSitemapEntries = async (): Promise<{
  listings: Entry[]
  posts: Entry[]
}> => {
  // Build-time DB may be unreachable — the sitemap regenerates hourly at
  // runtime with real content
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    try {
      return await queryEntries()
    } catch {
      return { listings: [], posts: [] }
    }
  }
  return queryEntries()
}

const queryEntries = async (): Promise<{ listings: Entry[]; posts: Entry[] }> => {
  const payload = await getPayloadClient()
  const [listings, posts] = await Promise.all([
    payload.find({
      collection: 'listings',
      where: { published: { equals: true } },
      limit: 5000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'posts',
      limit: 10000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
  ])

  const clean = (docs: { slug?: string | null; updatedAt: string }[]): Entry[] =>
    docs
      .filter((doc): doc is { slug: string; updatedAt: string } => Boolean(doc.slug))
      .map(({ slug, updatedAt }) => ({ slug, updatedAt }))

  return { listings: clean(listings.docs), posts: clean(posts.docs) }
}
