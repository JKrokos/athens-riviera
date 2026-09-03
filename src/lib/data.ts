import type { Where } from 'payload'

import { getPayloadClient } from './payloadClient'
import type { Area, Category, Listing, Post, SiteSetting } from '../payload-types'

// During `next build` the database may be unreachable (Railway's build
// environment has no access to the private network). Pages then prerender
// with empty content and fill in at runtime through ISR + on-demand
// revalidation. At runtime errors propagate normally.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

const safe = async <T>(fallback: T, query: () => Promise<T>): Promise<T> => {
  if (!isBuildPhase) return query()
  try {
    return await query()
  } catch {
    return fallback
  }
}

export const getSettings = async (): Promise<SiteSetting> =>
  safe({ id: 0 } as SiteSetting, async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'site-settings', depth: 1 })
  })

export const getHomepageCategories = async (): Promise<Category[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      where: { showOnHomepage: { equals: true } },
      sort: 'order',
      limit: 12,
      depth: 1,
    })
    return docs
  })

export const getAllCategories = async (): Promise<Category[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      sort: 'order',
      limit: 200,
      depth: 1,
    })
    return docs
  })

export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> =>
  safe(undefined, async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return docs[0]
  })

export const getAreas = async (featuredOnly = false): Promise<Area[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const where: Where | undefined = featuredOnly ? { featured: { equals: true } } : undefined
    const { docs } = await payload.find({
      collection: 'areas',
      where,
      sort: 'order',
      limit: 50,
      depth: 1,
    })
    return docs
  })

export const getAreaBySlug = async (slug: string): Promise<Area | undefined> =>
  safe(undefined, async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'areas',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return docs[0]
  })

const publishedWhere: Where = { published: { equals: true } }

export const getListings = async (options: {
  categoryId?: number
  areaId?: number
  featuredOnly?: boolean
  limit?: number
}): Promise<Listing[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const and: Where[] = [publishedWhere]
    if (options.categoryId) and.push({ categories: { contains: options.categoryId } })
    if (options.areaId) and.push({ area: { equals: options.areaId } })
    if (options.featuredOnly) and.push({ featured: { equals: true } })
    const { docs } = await payload.find({
      collection: 'listings',
      where: { and },
      sort: ['order', 'name'],
      limit: options.limit ?? 200,
      depth: 1,
    })
    return docs
  })

export const getListingBySlug = async (
  slug: string,
  { includeUnpublished = false }: { includeUnpublished?: boolean } = {},
): Promise<Listing | undefined> =>
  safe(undefined, async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'listings',
      where: includeUnpublished
        ? { slug: { equals: slug } }
        : { and: [{ slug: { equals: slug } }, publishedWhere] },
      limit: 1,
      depth: 1,
    })
    return docs[0]
  })

export const getRelatedListings = async (listing: Listing, limit = 4): Promise<Listing[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const primaryId =
      typeof listing.primaryCategory === 'object'
        ? listing.primaryCategory?.id
        : listing.primaryCategory
    if (!primaryId) return []
    const { docs } = await payload.find({
      collection: 'listings',
      where: {
        and: [
          publishedWhere,
          { categories: { contains: primaryId } },
          { id: { not_equals: listing.id } },
        ],
      },
      sort: ['order', 'name'],
      limit,
      depth: 1,
    })
    return docs
  })

export const getAllListingSlugs = async (): Promise<string[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'listings',
      where: publishedWhere,
      limit: 2000,
      depth: 0,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
  })

export const POSTS_PER_PAGE = 12

export const getPosts = async (
  page = 1,
): Promise<{ posts: Post[]; totalPages: number; totalDocs: number }> =>
  safe({ posts: [], totalPages: 1, totalDocs: 0 }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      sort: '-publishedAt',
      limit: POSTS_PER_PAGE,
      page,
      depth: 1,
    })
    return { posts: result.docs, totalPages: result.totalPages, totalDocs: result.totalDocs }
  })

export const getRecentPosts = async (limit = 3): Promise<Post[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      sort: '-publishedAt',
      limit,
      depth: 1,
    })
    return docs
  })

export const getPostsByArea = async (areaId: number, limit = 6): Promise<Post[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { area: { equals: areaId } },
      sort: '-publishedAt',
      limit,
      depth: 1,
    })
    return docs
  })

export const getPostBySlug = async (slug: string): Promise<Post | undefined> =>
  safe(undefined, async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return docs[0]
  })

export const getAllPostSlugs = async (): Promise<string[]> =>
  safe([], async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 5000,
      depth: 0,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
  })

export type SearchResults = {
  listings: Listing[]
  posts: Post[]
  categories: Category[]
  areas: Area[]
}

export const searchSite = async (query: string): Promise<SearchResults> => {
  const payload = await getPayloadClient()
  const like = query.trim()
  if (!like) return { listings: [], posts: [], categories: [], areas: [] }

  const [listings, posts, categories, areas] = await Promise.all([
    payload.find({
      collection: 'listings',
      where: {
        and: [
          publishedWhere,
          { or: [{ name: { like } }, { excerpt: { like } }, { 'contact.address': { like } }] },
        ],
      },
      limit: 30,
      depth: 1,
    }),
    payload.find({
      collection: 'posts',
      where: { or: [{ title: { like } }, { excerpt: { like } }] },
      sort: '-publishedAt',
      limit: 12,
      depth: 1,
    }),
    payload.find({
      collection: 'categories',
      where: { name: { like } },
      limit: 8,
      depth: 1,
    }),
    payload.find({
      collection: 'areas',
      where: { name: { like } },
      limit: 8,
      depth: 1,
    }),
  ])

  return {
    listings: listings.docs,
    posts: posts.docs,
    categories: categories.docs,
    areas: areas.docs,
  }
}

export const countListingsForCategories = async (
  categoryIds: number[],
): Promise<Record<number, number>> =>
  safe({}, async () => {
    const payload = await getPayloadClient()
    const counts = await Promise.all(
      categoryIds.map(async (id) => {
        const { totalDocs } = await payload.count({
          collection: 'listings',
          where: { and: [publishedWhere, { categories: { contains: id } }] },
        })
        return [id, totalDocs] as const
      }),
    )
    return Object.fromEntries(counts)
  })
