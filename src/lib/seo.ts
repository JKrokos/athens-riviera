import type { Metadata } from 'next'

import { site } from '../site.config'
import { asMedia, mediaUrl } from './media'
import type { Area, Category, Listing, Post, SiteSetting } from '../payload-types'

export const absoluteUrl = (path = '/'): string =>
  `${site.baseUrl}${path.startsWith('/') ? path : `/${path}`}`

export const pageTitle = (title?: string): string =>
  title ? `${title} · ${site.name}` : `${site.name} — ${site.tagline}`

const clip = (value: string | null | undefined, max = 160): string | undefined => {
  if (!value) return undefined
  const clean = value.replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

export const buildMetadata = (options: {
  title?: string
  description?: string | null
  path: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}): Metadata => {
  const title = pageTitle(options.title)
  const description = clip(options.description) || site.description
  const url = absoluteUrl(options.path)
  const images = options.image ? [{ url: options.image }] : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      type: options.type ?? 'website',
      ...(images ? { images } : {}),
    },
    twitter: {
      card: options.image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(images ? { images } : {}),
    },
    ...(options.noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}

// --------------------------------------------------------------------------
// JSON-LD builders
// --------------------------------------------------------------------------

type JsonLdObject = Record<string, unknown>

const compact = (object: JsonLdObject): JsonLdObject =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    }),
  )

export const organizationJsonLd = (settings: SiteSetting): JsonLdObject =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.baseUrl}/#organization`,
    name: settings.siteName || site.name,
    url: site.baseUrl,
    logo: mediaUrl(settings.logo) ? absoluteUrl(mediaUrl(settings.logo)!) : undefined,
    email: settings.contactEmail || site.defaultContact.email,
    telephone: settings.contactPhone || site.defaultContact.phone,
    sameAs: [settings.facebook, settings.instagram, settings.tiktok, settings.youtube].filter(
      Boolean,
    ),
    areaServed: {
      '@type': 'City',
      name: site.place.name,
      address: { '@type': 'PostalAddress', addressCountry: site.place.countryCode },
    },
  })

export const webSiteJsonLd = (settings: SiteSetting): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.baseUrl}/#website`,
  name: settings.siteName || site.name,
  url: site.baseUrl,
  inLanguage: site.language,
  publisher: { '@id': `${site.baseUrl}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${site.baseUrl}/search?q={query}` },
    'query-input': 'required name=query',
  },
})

export const breadcrumbJsonLd = (items: { name: string; path?: string }[]): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) =>
    compact({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path ? absoluteUrl(item.path) : undefined,
    }),
  ),
})

export const listingJsonLd = (listing: Listing): JsonLdObject => {
  const category =
    typeof listing.primaryCategory === 'object' ? listing.primaryCategory : undefined
  const area = typeof listing.area === 'object' ? listing.area : undefined
  const images = (listing.gallery ?? [])
    .map((item) => mediaUrl(item, 'card'))
    .filter((url): url is string => Boolean(url))
    .map((url) => (url.startsWith('http') ? url : absoluteUrl(url)))

  return compact({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': absoluteUrl(`/listing/${listing.slug}`),
    name: listing.name,
    url: absoluteUrl(`/listing/${listing.slug}`),
    description: clip(listing.excerpt, 300),
    image: images,
    email: listing.contact?.email || undefined,
    telephone: listing.contact?.phone || undefined,
    address: compact({
      '@type': 'PostalAddress',
      streetAddress: listing.contact?.address || undefined,
      addressLocality: area?.name || site.place.name,
      addressRegion: site.place.region,
      addressCountry: site.place.countryCode,
    }),
    geo:
      listing.location?.latitude && listing.location?.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: listing.location.latitude,
            longitude: listing.location.longitude,
          }
        : undefined,
    sameAs: [
      listing.socials?.facebook,
      listing.socials?.instagram,
      listing.socials?.youtube,
      listing.socials?.linkedin,
      listing.socials?.tiktok,
    ].filter(Boolean),
    additionalType: category ? absoluteUrl(`/category/${category.slug}`) : undefined,
  })
}

export const articleJsonLd = (post: Post): JsonLdObject =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': absoluteUrl(`/blog/${post.slug}`),
    headline: post.title,
    url: absoluteUrl(`/blog/${post.slug}`),
    description: clip(post.excerpt, 300),
    image: mediaUrl(asMedia(post.featuredImage), 'hero')
      ? [absoluteUrl(mediaUrl(asMedia(post.featuredImage), 'hero')!)]
      : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: post.language || 'en',
    author: { '@type': 'Organization', name: site.name, url: site.baseUrl },
    publisher: { '@id': `${site.baseUrl}/#organization` },
  })

export const collectionPageJsonLd = (options: {
  name: string
  description?: string | null
  path: string
  itemUrls: string[]
}): JsonLdObject =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: clip(options.description, 300),
    url: absoluteUrl(options.path),
    isPartOf: { '@id': `${site.baseUrl}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: options.itemUrls.slice(0, 50).map((url, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(url),
      })),
    },
  })

export const categoryMeta = (category: Category): Metadata =>
  buildMetadata({
    title: `Best ${category.name} in ${site.place.name}`,
    description:
      category.description ||
      `Discover the best ${category.name.toLowerCase()} in ${site.place.name}, ${site.place.countryName} — hand-picked places with photos, contact details and locations.`,
    path: `/category/${category.slug}`,
    image: mediaUrl(category.image, 'hero'),
  })

export const areaMeta = (area: Area): Metadata =>
  buildMetadata({
    title: `${area.name} — places to visit`,
    description:
      area.description ||
      `The best hotels, restaurants, shopping and experiences in ${area.name}, ${site.place.name}.`,
    path: `/region/${area.slug}`,
    image: mediaUrl(area.image, 'hero'),
  })
