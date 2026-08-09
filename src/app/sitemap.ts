import type { MetadataRoute } from 'next'

import { getAllCategories, getAreas, getPayloadSitemapEntries } from '../lib/sitemapData'
import { absoluteUrl } from '../lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { listings, posts } = await getPayloadSitemapEntries()
  const [categories, areas] = await Promise.all([getAllCategories(), getAreas()])

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/explore'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/blog'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/promote'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/privacy-policy'), changeFrequency: 'yearly', priority: 0.1 },
  ]

  return [
    ...staticPages,
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: new Date(category.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...areas.map((area) => ({
      url: absoluteUrl(`/region/${area.slug}`),
      lastModified: new Date(area.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...listings.map((listing) => ({
      url: absoluteUrl(`/listing/${listing.slug}`),
      lastModified: new Date(listing.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
