import type { Payload } from 'payload'

import {
  canonicalCategorySlug,
  cleanWordPressHtml,
  clip,
  decodeEntities,
  deSlugify,
  detectLanguage,
  fetchJson,
  fetchText,
  importImage,
  lexicalWithInlineImages,
  makeHtmlToLexical,
  parseListingPage,
  stripTags,
  upsertBySlug,
  type HtmlToLexical,
  type LexicalState,
  type Log,
} from './importer'

// Imports a destination guide from flyingtogreece.com (the network hub) into
// an area of this site: the page's hero image, intro and guide text become
// the area's cover, description and content; the guide pages it links to
// become posts attached to the area; the businesses it lists become listings
// in the area. Re-runnable — everything upserts by slug or source URL.

const FTG = 'https://flyingtogreece.com'

// Top-level paths that are navigation, taxonomy or listings, not guide pages
const NOT_GUIDE = new Set([
  'listing',
  'category',
  'region',
  'blog',
  'my-account',
  'feed',
  'wp-json',
  'wp-content',
  'xmlrpc.php',
  'tag',
  'author',
  'cart',
  'checkout',
  'shop',
  'contact',
  'contact-us',
  'about',
  'about-us',
])

type WpDoc = {
  id: number
  slug: string
  type: string
  link: string
  date_gmt?: string
  featured_media?: number
  title?: { rendered?: string }
  excerpt?: { rendered?: string }
  content?: { rendered?: string }
}

export type FtgAreaOptions = { pageSlug: string; areaSlug: string }

export type FtgAreaSummary = {
  area: string
  guides: number
  listings: number
  gallery: number
  skipped: string[]
}

const restFirst = async (path: string): Promise<WpDoc | null> => {
  const docs = (await fetchJson(`${FTG}/wp-json/wp/v2/${path}`)) as WpDoc[]
  return Array.isArray(docs) && docs[0] ? docs[0] : null
}

const mediaSourceUrl = async (id: number): Promise<string | null> => {
  try {
    const media = (await fetchJson(`${FTG}/wp-json/wp/v2/media/${id}`)) as { source_url?: string }
    return media?.source_url ?? null
  } catch {
    return null
  }
}

const nodeText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const record = node as { text?: unknown; children?: unknown[] }
  if (typeof record.text === 'string') return record.text
  return Array.isArray(record.children) ? record.children.map(nodeText).join('') : ''
}

const isEmptyTextNode = (node: unknown): boolean => {
  const type = (node as { type?: string })?.type
  if (type === 'upload' || type === 'block' || type === 'horizontalrule') return false
  return nodeText(node).replace(/ /g, ' ').trim().length === 0
}

// Elementor's div soup converts into runs of empty paragraphs — drop them,
// and drop a leading heading that only repeats the document title
const tidy = (state: LexicalState, title?: string): LexicalState => {
  const children = (state.root.children as unknown[]).filter((node) => !isEmptyTextNode(node))
  const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  if (title && children.length > 0 && normalize(nodeText(children[0])) === normalize(title)) {
    children.shift()
  }
  state.root.children = children
  return state
}

// Guide body = everything before the first "Best …" section; those sections
// are listing carousels, which are imported as proper listings instead
const guideHtml = (html: string): string => {
  const cleaned = cleanWordPressHtml(html)
  const match = cleaned.match(/<h[1-4][^>]*>(?:\s*<[^>]+>)*\s*Best\s/i)
  return match && match.index !== undefined ? cleaned.slice(0, match.index) : cleaned
}

const resolveCategories = async (
  payload: Payload,
  rawSlugs: string[],
  names: Record<string, string>,
): Promise<number[]> => {
  const ids: number[] = []
  for (const raw of rawSlugs) {
    const slug = canonicalCategorySlug(raw)
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    let id = existing.docs[0]?.id
    if (!id) {
      const created = await payload.create({
        collection: 'categories',
        data: { name: names[raw] ?? deSlugify(slug), slug },
      })
      id = created.id
    }
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

const importGuide = async (
  payload: Payload,
  htmlToLexical: HtmlToLexical,
  slug: string,
  areaId: number,
  log: Log,
): Promise<{ imported: boolean; featuredImageId: number | null }> => {
  const doc =
    (await restFirst(`pages?slug=${encodeURIComponent(slug)}`)) ??
    (await restFirst(`posts?slug=${encodeURIComponent(slug)}`))
  if (!doc) {
    log(`  ! guide ${slug}: not found`)
    return { imported: false, featuredImageId: null }
  }
  const title = stripTags(doc.title?.rendered || deSlugify(slug))
  const excerpt = clip(stripTags(doc.excerpt?.rendered || ''), 300)

  let featuredImageId: number | null = null
  if (doc.featured_media) {
    const url = await mediaSourceUrl(doc.featured_media)
    if (url) featuredImageId = await importImage(payload, url, title, log)
  }

  const body = cleanWordPressHtml(doc.content?.rendered || '')
  const content = tidy(await lexicalWithInlineImages(payload, htmlToLexical, body, title, log), title)

  await upsertBySlug(payload, 'posts', slug, {
    title,
    excerpt: excerpt || undefined,
    content,
    ...(featuredImageId ? { featuredImage: featuredImageId } : {}),
    publishedAt: doc.date_gmt ? `${doc.date_gmt}Z` : undefined,
    language: detectLanguage(`${title} ${excerpt}`),
    sourceUrl: doc.link,
    area: areaId,
  })
  log(`  ✓ guide ${slug}`)
  return { imported: true, featuredImageId }
}

const importListing = async (
  payload: Payload,
  htmlToLexical: HtmlToLexical,
  url: string,
  areaId: number,
  log: Log,
): Promise<boolean> => {
  const slug = decodeURIComponent(url.match(/\/listing\/([^/]+)$/)![1]).toLowerCase()
  const html = await fetchText(`${url}/`)
  const parsed = parseListingPage(html, `${url}/`)
  if (!parsed) {
    log(`  ! listing ${slug}: could not parse page`)
    return false
  }

  // The same business may already exist here under another slug (imported
  // from this site's own WordPress) — update it rather than duplicating
  const byName = await payload.find({
    collection: 'listings',
    where: { name: { equals: parsed.name } },
    limit: 1,
    depth: 0,
  })
  const targetSlug = byName.docs[0]?.slug ?? slug

  const galleryIds: number[] = []
  for (const imageUrl of parsed.images) {
    const id = await importImage(payload, imageUrl, parsed.name, log)
    if (id) galleryIds.push(id)
  }
  const categoryIds = await resolveCategories(payload, parsed.categorySlugs, parsed.categoryNames)

  await upsertBySlug(payload, 'listings', targetSlug, {
    name: parsed.name,
    categories: categoryIds,
    primaryCategory: categoryIds[0] ?? null,
    area: areaId,
    excerpt: parsed.excerpt || undefined,
    description: parsed.descriptionHtml ? htmlToLexical(parsed.descriptionHtml) : undefined,
    gallery: galleryIds,
    contact: {
      phone: parsed.phone,
      email: parsed.email,
      address: parsed.address,
      website: parsed.website,
      bookingLink: parsed.bookingLink,
    },
    socials: {
      facebook: parsed.facebook,
      instagram: parsed.instagram,
      youtube: parsed.youtube,
      linkedin: parsed.linkedin,
      tiktok: parsed.tiktok,
    },
    location: { latitude: parsed.latitude, longitude: parsed.longitude },
    published: true,
    sourceUrl: `${url}/`,
  })
  log(`  ✓ listing ${targetSlug}${targetSlug !== slug ? ` (matched existing "${parsed.name}")` : ''} (${galleryIds.length} images)`)
  return true
}

export async function importFlyingToGreeceArea(
  payload: Payload,
  log: Log,
  { pageSlug, areaSlug }: FtgAreaOptions,
): Promise<FtgAreaSummary> {
  log(`flyingtogreece: importing /${pageSlug}/ into area "${areaSlug}"`)
  const htmlToLexical = await makeHtmlToLexical(payload)

  const page = await restFirst(`pages?slug=${encodeURIComponent(pageSlug)}`)
  if (!page) throw new Error(`page "${pageSlug}" not found on ${FTG}`)
  const pageTitle = stripTags(page.title?.rendered || deSlugify(areaSlug))

  const existingArea = await payload.find({
    collection: 'areas',
    where: { slug: { equals: areaSlug } },
    limit: 1,
    depth: 0,
  })
  const areaId =
    existingArea.docs[0]?.id ??
    (await payload.create({ collection: 'areas', data: { name: pageTitle, slug: areaSlug } })).id
  const areaName = existingArea.docs[0]?.name ?? pageTitle

  // Dedicated cover image
  let imageId: number | null = null
  if (page.featured_media) {
    const url = await mediaSourceUrl(page.featured_media)
    if (url) imageId = await importImage(payload, url, areaName, log)
  }

  const contentHtml = page.content?.rendered || ''
  const links = [
    ...new Set(
      [...contentHtml.matchAll(/href="(https?:\/\/flyingtogreece\.com\/[^"#?]+)"/gi)].map((match) =>
        match[1].replace(/\/$/, ''),
      ),
    ),
  ]

  const skipped: string[] = []
  const galleryIds: number[] = []

  // Guide pages: top-level pages the area page links to
  const guideSlugs = links
    .map((url) => new URL(url).pathname.split('/').filter(Boolean))
    .filter((segments) => segments.length === 1 && !NOT_GUIDE.has(segments[0]) && segments[0] !== pageSlug)
    .map((segments) => decodeURIComponent(segments[0]).toLowerCase())
  log(`  guides: ${guideSlugs.length} pages (${guideSlugs.join(', ')})`)
  let guides = 0
  for (const slug of guideSlugs) {
    try {
      const result = await importGuide(payload, htmlToLexical, slug, areaId, log)
      if (result.imported) guides += 1
      else skipped.push(slug)
      if (result.featuredImageId) galleryIds.push(result.featuredImageId)
    } catch (error) {
      skipped.push(slug)
      log(`  ! guide ${slug} failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  // Listings featured on the page
  const listingUrls = links.filter((url) => /\/listing\/[^/]+$/.test(url))
  log(`  listings: ${listingUrls.length} pages`)
  let listings = 0
  for (const url of listingUrls) {
    try {
      if (await importListing(payload, htmlToLexical, url, areaId, log)) listings += 1
      else skipped.push(url)
    } catch (error) {
      skipped.push(url)
      log(`  ! listing ${url} failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  // Full-size photos placed on the page itself (Elementor thumbnails are
  // resized copies and are skipped)
  const pageImages = [
    ...new Set(
      [...contentHtml.matchAll(/<img[^>]+src="([^"]+)"/gi)]
        .map((match) => decodeEntities(match[1]))
        .filter((src) => /\/wp-content\/uploads\//.test(src) && !/\/elementor\/thumbs\//.test(src)),
    ),
  ]
  for (const src of pageImages) {
    const id = await importImage(payload, src, areaName, log)
    if (id) galleryIds.push(id)
  }

  const content = tidy(htmlToLexical(guideHtml(contentHtml)), pageTitle)
  const description = clip(stripTags(page.excerpt?.rendered || ''), 300)
  const gallery = [...new Set(galleryIds)].filter((id) => id !== imageId)
  await payload.update({
    collection: 'areas',
    id: areaId,
    data: {
      ...(imageId ? { image: imageId } : {}),
      ...(description ? { description } : {}),
      content,
      gallery,
    },
  })

  const summary: FtgAreaSummary = { area: areaSlug, guides, listings, gallery: gallery.length, skipped }
  log(`flyingtogreece: done ${JSON.stringify(summary)}`)
  return summary
}
