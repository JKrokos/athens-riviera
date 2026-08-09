import type { Where } from 'payload'

import { getPayloadClient } from './payloadClient'
import type { Area, Category, Listing, Post, SiteSetting } from '../payload-types'

export const getSettings = async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
}

export const getHomepageCategories = async (): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { showOnHomepage: { equals: true } },
    sort: 'order',
    limit: 12,
    depth: 1,
  })
  return docs
}

export const getAllCategories = async (): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    sort: 'order',
    limit: 200,
    depth: 1,
  })
  return docs
}

export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0]
}

export const getAreas = async (featuredOnly = false): Promise<Area[]> => {
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
}

export const getAreaBySlug = async (slug: string): Promise<Area | undefined> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'areas',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0]
}

const publishedWhere: Where = { published: { equals: true } }

export const getListings = async (options: {
  categoryId?: number
  areaId?: number
  featuredOnly?: boolean
  limit?: number
}): Promise<Listing[]> => {
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
}

export const getListingBySlug = async (slug: string): Promise<Listing | undefined> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'listings',
    where: { and: [{ slug: { equals: slug } }, publishedWhere] },
    limit: 1,
    depth: 1,
  })
  return docs[0]
}

export const getRelatedListings = async (listing: Listing, limit = 4): Promise<Listing[]> => {
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
}

export const getAllListingSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'listings',
    where: publishedWhere,
    limit: 2000,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

export const POSTS_PER_PAGE = 12

export const getPosts = async (
  page = 1,
): Promise<{ posts: Post[]; totalPages: number; totalDocs: number }> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    sort: '-publishedAt',
    limit: POSTS_PER_PAGE,
    page,
    depth: 1,
  })
  return { posts: result.docs, totalPages: result.totalPages, totalDocs: result.totalDocs }
}

export const getRecentPosts = async (limit = 3): Promise<Post[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    sort: '-publishedAt',
    limit,
    depth: 1,
  })
  return docs
}

export const getPostBySlug = async (slug: string): Promise<Post | undefined> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0]
}

export const getAllPostSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 5000,
    depth: 0,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

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
): Promise<Record<number, number>> => {
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
}
