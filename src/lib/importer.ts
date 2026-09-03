import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload } from 'payload'

import { site } from '../site.config'

// ---------------------------------------------------------------------------
// One-shot importer that migrates the old WordPress (MyListing theme) site
// into Payload. The listing post type is not exposed over REST, so listings
// are discovered through the Yoast sitemaps and scraped from their pages
// (each page carries LocalBusiness JSON-LD plus category/region/contact
// links). Posts and their media come from the regular WP REST API.
// Idempotent: re-runs upsert by slug and skip already-downloaded media
// (matched on sourceUrl).
// ---------------------------------------------------------------------------

const WP = site.legacy.wpBaseUrl
const UA = 'Mozilla/5.0 (compatible; AthensNetworkImporter/1.0)'
const REQUEST_GAP_MS = 400
const CHALLENGE_MARKER = 'One moment, please'

const LISTING_LIMIT = Number(process.env.IMPORT_LISTING_LIMIT || 0) || Infinity
const POST_LIMIT = Number(process.env.IMPORT_POST_LIMIT || 0) || Infinity
const MAX_IMAGES = Number(process.env.IMPORT_MAX_IMAGES_PER_LISTING || 12)
const MAX_POST_INLINE_IMAGES = 6

export type Log = (message: string) => void

export type ImportSummary = {
  categories: number
  areas: number
  listings: number
  posts: number
  mediaFailures: number
  skipped: string[]
}

// ----------------------------- shared status -------------------------------

type ImportStatus = {
  state: 'idle' | 'running' | 'done' | 'error'
  startedAt?: string
  finishedAt?: string
  lastMessage?: string
  recentLog: string[]
  summary?: ImportSummary
  error?: string
}

const status: ImportStatus = { state: 'idle', recentLog: [] }

export const getImportStatus = (): ImportStatus => status

export const startBackgroundImport = (payload: Payload): boolean => {
  if (status.state === 'running') return false
  status.state = 'running'
  status.startedAt = new Date().toISOString()
  status.finishedAt = undefined
  status.error = undefined
  status.summary = undefined
  status.recentLog = []

  const log: Log = (message) => {
    payload.logger.info(`[wp-import] ${message}`)
    status.lastMessage = message
    status.recentLog.push(`${new Date().toISOString()} ${message}`)
    if (status.recentLog.length > 300) status.recentLog.splice(0, 100)
  }

  void runWordPressImport(payload, log)
    .then((summary) => {
      status.state = 'done'
      status.summary = summary
      status.finishedAt = new Date().toISOString()
    })
    .catch((error) => {
      status.state = 'error'
      status.error = error instanceof Error ? error.message : String(error)
      status.finishedAt = new Date().toISOString()
    })
  return true
}

// --------------------------------- utils ----------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let lastRequestAt = 0
const throttle = async () => {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()
}

async function fetchRaw(url: string, asBuffer: boolean, tries = 6): Promise<string | Buffer> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      await throttle()
      const response = await fetch(url, { headers: { 'User-Agent': UA } })
      if (response.status === 404 || response.status === 410) {
        // Gone for good (dead media on the old site) — retrying won't help
        throw Object.assign(new Error(`HTTP ${response.status}`), { permanent: true })
      }
      if (response.status === 403 || response.status === 429) {
        // Rate limited by the source's firewall — give it a real breather
        throw Object.assign(new Error(`HTTP ${response.status}`), { cooldown: true })
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (asBuffer) return Buffer.from(await response.arrayBuffer())
      const text = await response.text()
      // The old sites intermittently serve a JS bot-challenge page instead
      // of the real content — treat it as a retryable failure.
      if (text.includes(CHALLENGE_MARKER)) throw new Error('bot challenge page')
      return text
    } catch (error) {
      const flags = error as { permanent?: boolean; cooldown?: boolean }
      if (flags.permanent || attempt === tries) throw error
      await sleep(
        flags.cooldown
          ? 20_000 * attempt
          : 1500 * attempt + Math.floor(Math.random() * 500),
      )
    }
  }
  throw new Error('unreachable')
}

export const fetchText = (url: string): Promise<string> => fetchRaw(url, false) as Promise<string>
const fetchBuffer = (url: string): Promise<Buffer> => fetchRaw(url, true) as Promise<Buffer>
export const fetchJson = async (url: string): Promise<unknown> => JSON.parse(await fetchText(url))

async function fetchAllRestPages(base: string, limit: number): Promise<Record<string, any>[]> {
  const all: Record<string, any>[] = []
  for (let page = 1; page <= 50; page++) {
    let items: unknown
    try {
      items = await fetchJson(`${base}${base.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    } catch {
      break
    }
    if (!Array.isArray(items) || items.length === 0) break
    all.push(...items)
    if (all.length >= limit || items.length < 100) break
  }
  return all.slice(0, Number.isFinite(limit) ? limit : all.length)
}

export const decodeEntities = (input: string): string =>
  (input || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))

export const stripTags = (html: string): string =>
  decodeEntities(
    (html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()

export const clip = (text: string, max = 220): string =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text

export const deSlugify = (slug: string): string =>
  decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

// Greek-language detection for imported posts (drives the html lang attr)
export const detectLanguage = (text: string): 'en' | 'el' => {
  const greek = (text.match(/[Ͱ-Ͽ]/g) || []).length
  return greek > text.length * 0.25 ? 'el' : 'en'
}

const sitemapLocs = async (url: string): Promise<string[]> => {
  try {
    const xml = await fetchText(url)
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  } catch {
    return []
  }
}

// WordPress size-suffixed files (photo-800x600.jpg) → original photo.jpg
export const originalImageUrl = (url: string): string =>
  url.split('?')[0].replace(/-\d{2,4}x\d{2,4}(?=\.(?:jpe?g|png|webp|gif)$)/i, '')

// ------------------------------ HTML → lexical -----------------------------

export type LexicalState = Record<string, any>

export const emptyLexical = (): LexicalState => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [],
  },
})

export const paragraphNode = (text: string) => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [
    { type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 },
  ],
})

export const uploadNode = (mediaId: number) => ({
  type: 'upload',
  version: 3,
  format: '',
  fields: null,
  relationTo: 'media',
  value: mediaId,
})

export const cleanWordPressHtml = (html: string): string =>
  (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\/?[a-zA-Z0-9_-]+[^\]]*\]/g, '') // WP shortcodes
    .replace(/<(figure|figcaption|iframe|form|button|input)[^>]*>/gi, '')
    .replace(/<\/(figure|figcaption|iframe|form|button|input)>/gi, '')

export type HtmlToLexical = (html: string) => LexicalState

export const makeHtmlToLexical = async (payload: Payload): Promise<HtmlToLexical> => {
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  return (html: string) => {
    const cleaned = cleanWordPressHtml(html).replace(/<img[^>]*>/gi, '')
    try {
      const state = convertHTMLToLexical({ editorConfig, html: cleaned, JSDOM })
      if (state?.root?.children?.length) return state as unknown as LexicalState
    } catch {
      // fall through to the plain-paragraph fallback
    }
    const fallback = emptyLexical()
    for (const chunk of cleaned.split(/<\/(?:p|h[1-6]|li|div)>/i)) {
      const text = stripTags(chunk)
      if (text) fallback.root.children.push(paragraphNode(text))
    }
    return fallback
  }
}

// ------------------------------ media import -------------------------------

let mediaFailures = 0

const mimeFor = (name: string): string =>
  name.endsWith('.png')
    ? 'image/png'
    : name.endsWith('.webp')
      ? 'image/webp'
      : name.endsWith('.gif')
        ? 'image/gif'
        : 'image/jpeg'

export async function importImage(
  payload: Payload,
  url: string,
  alt: string,
  log: Log,
): Promise<number | null> {
  const clean = originalImageUrl(url)
  try {
    const existing = await payload.find({
      collection: 'media',
      where: { sourceUrl: { equals: clean } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) return existing.docs[0].id

    let data: Buffer
    try {
      data = await fetchBuffer(clean)
    } catch {
      // The original may not exist (only resized variants) — take the given
      data = await fetchBuffer(url.split('?')[0])
    }
    const name = decodeURIComponent(clean.split('/').pop() || 'image.jpg')
    const doc = await payload.create({
      collection: 'media',
      data: { alt, sourceUrl: clean },
      file: { data, name, mimetype: mimeFor(name.toLowerCase()), size: data.length },
    })
    return doc.id
  } catch (error) {
    mediaFailures += 1
    log(`    ! image failed ${clean}: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

// --------------------------- listing page parsing --------------------------

const SHARE_HOSTS = [
  'facebook.com/share',
  'facebook.com/sharer',
  'x.com/share',
  'twitter.com/share',
  'linkedin.com/share',
  'pinterest.com/pin',
  'reddit.com/submit',
  'tumblr.com/share',
  'telegram.me/share',
  'api.whatsapp.com',
  'vk.com/share',
  'm.me/',
]

const NETWORK_HOSTS = [
  new URL(WP).hostname.replace(/^www\./, ''),
  'athensbest.eu',
  'athensriviera.eu',
  'mykonosbest.eu',
  'santorinibest.eu',
  'parosbest.eu',
  'aegeanislands.promo',
  'flyingtogreece.com',
  'webee.gr',
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'wordpress.org',
  'wp.com',
  'youtube.com/embed',
]

// The network's own social handles — never a listing's own profile
const NETWORK_SOCIAL_FRAGMENTS = [
  'flyingtogreece',
  'athensbest',
  'athens_best',
  'athensriviera',
  'athens_riviera',
  'moregreece',
  'mykonosbest',
  'santorinibest',
  'parosbest',
]

const BOOKING_HOSTS = [
  'booking.com',
  'airbnb.',
  'getyourguide.',
  'viator.com',
  'opentable.',
  'e-table.gr',
  'tripadvisor.',
  'ferryhopper.com',
]

type ParsedListing = {
  name: string
  descriptionHtml: string
  excerpt: string
  categorySlugs: string[]
  // Clean term names harvested from the listing's category/region badges —
  // the term archive pages themselves only expose custom SEO titles
  categoryNames: Record<string, string>
  regionName: string | null
  regionSlug: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  bookingLink: string | null
  facebook: string | null
  instagram: string | null
  youtube: string | null
  linkedin: string | null
  tiktok: string | null
  latitude: string | null
  longitude: string | null
  images: string[]
}

const findJsonLdBlocks = (html: string): Record<string, any>[] => {
  const blocks: Record<string, any>[] = []
  for (const match of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      blocks.push(JSON.parse(match[1]))
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return blocks
}

const metaContent = (html: string, property: string): string | null => {
  const match =
    html.match(
      new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`, 'i'),
    ) ||
    html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${property}"`, 'i'))
  return match ? decodeEntities(match[1]) : null
}

export function parseListingPage(html: string, pageUrl: string): ParsedListing | null {
  const jsonLd = findJsonLdBlocks(html)
  const business = jsonLd.find(
    (block) => block['@type'] === 'LocalBusiness' || block['@type'] === 'Organization',
  )

  const ogTitle = metaContent(html, 'og:title')
  const name = decodeEntities(
    (business?.name as string) || (ogTitle ? ogTitle.split(/\s+[-–]\s+/)[0] : ''),
  ).trim()
  if (!name) return null

  const descriptionHtml = (business?.description as string) || ''
  const excerpt = clip(
    stripTags(descriptionHtml) || metaContent(html, 'og:description') || '',
  )

  const document = new JSDOM(html).window.document

  // Strip site chrome and cross-listing blocks before extracting anything:
  // the site header/footer carry the network's own social links, and the
  // related-listings tab carries other businesses' categories and images.
  for (const selector of [
    'header',
    'footer',
    'nav',
    '.profile-menu',
    '.quick-listing-actions',
    '.mylisting-dialog-wrapper',
    '[class*="related-listings"]',
    '[class*="tab-type-related"]',
    '[id*="related"]',
    '.c27-listing-preview-category-list',
  ]) {
    for (const element of document.querySelectorAll(selector)) element.remove()
  }

  const hrefs = [...document.querySelectorAll('a[href]')].map((anchor) =>
    decodeEntities(anchor.getAttribute('href') || ''),
  )

  // Category/region assignments only count when they come from the listing's
  // own details blocks, never from loose links elsewhere on the page.
  const detailAnchorElements = [
    ...document.querySelectorAll(
      '.listing-details a[href], .details-list a[href], .pf-body a[href]',
    ),
  ]
  const detailAnchors = detailAnchorElements.map((anchor) =>
    decodeEntities(anchor.getAttribute('href') || ''),
  )

  const categoryNames: Record<string, string> = {}
  let regionName: string | null = null
  for (const anchor of detailAnchorElements) {
    const href = decodeEntities(anchor.getAttribute('href') || '')
    const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    const categorySlug = href.match(/\/category\/([^/"?#]+)\/?/)?.[1]
    if (categorySlug) categoryNames[decodeURIComponent(categorySlug).toLowerCase()] = text
    const region = href.match(/\/region\/([^/"?#]+)\/?/)?.[1]
    if (region) regionName = text
  }

  const categorySlugs = [
    ...new Set(
      detailAnchors
        .map((href) => href.match(/\/category\/([^/"?#]+)\/?/)?.[1])
        .filter((slug): slug is string => Boolean(slug))
        .map((slug) => decodeURIComponent(slug).toLowerCase()),
    ),
  ]

  const regionSlug =
    detailAnchors
      .map((href) => href.match(/\/region\/([^/"?#]+)\/?/)?.[1])
      .filter(Boolean)
      .map((slug) => decodeURIComponent(slug!).toLowerCase())[0] ?? null

  const phone =
    hrefs
      .map((href) => href.match(/^tel:(.+)$/)?.[1])
      .filter(Boolean)
      .map((value) => decodeURIComponent(value!).trim())[0] ??
    ((business?.telephone as string) || null)

  const email =
    ((business?.email as string) || null) ??
    hrefs
      .map((href) => href.match(/^mailto:([^?]+)$/)?.[1])
      .filter(Boolean)
      .map((value) => decodeURIComponent(value!).trim())[0] ??
    null

  const externals = hrefs.filter((href) => {
    if (!/^https?:\/\//i.test(href)) return false
    if (SHARE_HOSTS.some((fragment) => href.includes(fragment))) return false
    if (NETWORK_HOSTS.some((fragment) => href.includes(fragment))) return false
    if (NETWORK_SOCIAL_FRAGMENTS.some((fragment) => href.toLowerCase().includes(fragment)))
      return false
    return true
  })

  const social = (fragment: string): string | null =>
    externals.find((href) => href.includes(fragment)) ?? null

  const facebook = social('facebook.com')
  const instagram = social('instagram.com')
  const youtube = social('youtube.com') ?? social('youtu.be')
  const linkedin = social('linkedin.com')
  const tiktok = social('tiktok.com')
  const bookingLink =
    externals.find((href) => BOOKING_HOSTS.some((fragment) => href.includes(fragment))) ?? null

  const website =
    externals.find(
      (href) =>
        ![facebook, instagram, youtube, linkedin, tiktok, bookingLink].includes(href) &&
        !href.includes('facebook.com') &&
        !href.includes('instagram.com') &&
        !href.includes('youtube.') &&
        !href.includes('linkedin.') &&
        !href.includes('tiktok.'),
    ) ?? null

  const geo = (business?.geo ?? {}) as Record<string, unknown>
  const latitude = geo.latitude !== undefined ? String(geo.latitude) : null
  const longitude = geo.longitude !== undefined ? String(geo.longitude) : null

  const addressData = business?.address as Record<string, unknown> | string | undefined
  const address =
    typeof addressData === 'string'
      ? addressData
      : ((addressData?.streetAddress as string) || null)

  // Gallery, scoped to the listing's own blocks: cover photo (background
  // image), the photoswipe gallery grid, and JSON-LD image arrays
  const imageCandidates: string[] = []

  const cover = document.querySelector('.profile-cover')
  const coverStyle = cover?.getAttribute('style') || ''
  const coverMatch = coverStyle.match(/url\(['"]?([^'")]+)['"]?\)/)
  if (coverMatch) imageCandidates.push(coverMatch[1])

  for (const element of document.querySelectorAll(
    '.gallery-grid img[src], .gallery-grid a[href], .photoswipe-gallery img[src], .photoswipe-gallery a[href], a.profile-avatar[href]',
  )) {
    const value = element.getAttribute('src') || element.getAttribute('href') || ''
    if (/\/wp-content\/uploads\//.test(value)) imageCandidates.push(value)
  }
  const avatarStyle = document.querySelector('a.profile-avatar')?.getAttribute('style') || ''
  const avatarMatch = avatarStyle.match(/url\(['"]?([^'")]+)['"]?\)/)
  if (avatarMatch) imageCandidates.push(avatarMatch[1])

  for (const key of ['image', 'photo', 'photos', 'logo'] as const) {
    const value = business?.[key]
    if (Array.isArray(value)) imageCandidates.push(...value.filter((v) => typeof v === 'string'))
    else if (typeof value === 'string') imageCandidates.push(value)
  }
  const ogImage = metaContent(html, 'og:image')
  if (ogImage && /\/wp-content\/uploads\//.test(ogImage)) imageCandidates.push(ogImage)

  const images = [
    ...new Set(
      imageCandidates
        .map((url) => originalImageUrl(decodeEntities(url)))
        .filter((url) => /^https?:\/\//.test(url))
        .filter((url) => !/cropped-|favicon|site-icon|\/themes\/|\/plugins\//i.test(url)),
    ),
  ].slice(0, MAX_IMAGES)

  void pageUrl
  return {
    name,
    descriptionHtml,
    excerpt,
    categorySlugs,
    categoryNames,
    regionName,
    regionSlug,
    phone,
    email,
    address,
    website,
    bookingLink,
    facebook,
    instagram,
    youtube,
    linkedin,
    tiktok,
    latitude,
    longitude,
    images,
  }
}

// ------------------------------ upsert helpers -----------------------------

export async function upsertBySlug(
  payload: Payload,
  collection: 'categories' | 'areas' | 'listings' | 'posts',
  slug: string,
  data: Record<string, unknown>,
): Promise<number> {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    const doc = await payload.update({
      collection,
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })
    return doc.id
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await payload.create({ collection, data: { ...data, slug } as any })
  return doc.id
}

// --------------------------------- steps -----------------------------------

export const canonicalCategorySlug = (slug: string): string =>
  site.legacy.categoryMerges[slug] ?? slug

const canonicalRegionSlug = (slug: string): string | null => {
  const mapped = site.legacy.regionMerges[slug] ?? slug
  return (site.legacy.dropRegions as readonly string[]).includes(mapped) ? null : mapped
}

type TaxonomyPageMeta = { name: string; description: string | null; image: string | null }

async function fetchTaxonomyPageMeta(url: string, fallbackName: string): Promise<TaxonomyPageMeta> {
  try {
    const html = await fetchText(url)
    // og:title is "<Term> Archives <sep> <Site>" — cut at the " Archives"
    // marker when present (plain hyphens can be part of the term itself,
    // e.g. Bar - Restaurants)
    const ogTitle = decodeEntities(metaContent(html, 'og:title') || '')
    let name = (
      /\sArchives\b/i.test(ogTitle)
        ? ogTitle.split(/\s+Archives\b/i)[0]
        : ogTitle.split(/\s+[–—|]\s+/)[0]
    ).trim()
    // Custom SEO titles ("Best Restaurants in - Athens Riviera & …") are not
    // term names — fall back to the slug; listing badges refine names later
    if (!name || name.length > 32) name = fallbackName
    const rawDescription = metaContent(html, 'og:description') || metaContent(html, 'description')
    // Yoast auto-generates "Browse listings in X | Site" for term archives —
    // that is noise, not a real description
    const description =
      rawDescription && !/^browse listings/i.test(rawDescription.trim())
        ? clip(stripTags(rawDescription), 300)
        : null
    const image = metaContent(html, 'og:image')
    return {
      name: name || fallbackName,
      description,
      image: image && /\/wp-content\/uploads\//.test(image) ? originalImageUrl(image) : null,
    }
  } catch {
    return { name: fallbackName, description: null, image: null }
  }
}

async function importCategories(
  payload: Payload,
  log: Log,
): Promise<Map<string, number>> {
  const locs = await sitemapLocs(`${WP}/job_listing_category-sitemap.xml`)
  const slugs = [
    ...new Set(
      locs
        .map((loc) => loc.match(/\/category\/([^/]+)\/?$/)?.[1])
        .filter((slug): slug is string => Boolean(slug))
        .map((slug) => canonicalCategorySlug(decodeURIComponent(slug).toLowerCase())),
    ),
  ]
  log(`categories: ${slugs.length} canonical slugs`)

  const ids = new Map<string, number>()
  for (const slug of slugs) {
    const meta = await fetchTaxonomyPageMeta(`${WP}/category/${encodeURIComponent(slug)}/`, deSlugify(slug))
    const imageId = meta.image ? await importImage(payload, meta.image, meta.name, log) : null
    const id = await upsertBySlug(payload, 'categories', slug, {
      name: meta.name,
      description: meta.description,
      ...(imageId ? { image: imageId } : {}),
    })
    ids.set(slug, id)
    log(`  ✓ category ${slug} (#${id})`)
  }
  return ids
}

async function importAreas(payload: Payload, log: Log): Promise<Map<string, number>> {
  const locs = await sitemapLocs(`${WP}/region-sitemap.xml`)
  const slugs = [
    ...new Set(
      locs
        .map((loc) => loc.match(/\/region\/([^/]+)\/?$/)?.[1])
        .filter((slug): slug is string => Boolean(slug))
        .map((slug) => canonicalRegionSlug(decodeURIComponent(slug).toLowerCase()))
        .filter((slug): slug is string => slug !== null),
    ),
  ]
  log(`areas: ${slugs.length} canonical slugs`)

  const ids = new Map<string, number>()
  for (const slug of slugs) {
    const meta = await fetchTaxonomyPageMeta(`${WP}/region/${encodeURIComponent(slug)}/`, deSlugify(slug))
    const imageId = meta.image ? await importImage(payload, meta.image, meta.name, log) : null
    const id = await upsertBySlug(payload, 'areas', slug, {
      name: meta.name,
      description: meta.description,
      ...(imageId ? { image: imageId } : {}),
    })
    ids.set(slug, id)
    log(`  ✓ area ${slug} (#${id})`)
  }
  return ids
}

export type HarvestedNames = {
  categories: Map<string, string>
  areas: Map<string, string>
}

async function importListings(
  payload: Payload,
  htmlToLexical: HtmlToLexical,
  categoryIds: Map<string, number>,
  areaIds: Map<string, number>,
  log: Log,
): Promise<{ imported: number; skipped: string[]; harvested: HarvestedNames }> {
  const locs = await sitemapLocs(`${WP}/job_listing-sitemap.xml`)
  const urls = locs
    .filter((loc) => /\/listing\/[^/]+\/?$/.test(loc))
    .slice(0, Number.isFinite(LISTING_LIMIT) ? LISTING_LIMIT : locs.length)
  log(`listings: ${urls.length} pages to import`)

  const skipped: string[] = []
  const harvested: HarvestedNames = { categories: new Map(), areas: new Map() }
  let imported = 0

  for (const [index, url] of urls.entries()) {
    const slug = decodeURIComponent(url.match(/\/listing\/([^/]+)\/?$/)![1]).toLowerCase()
    try {
      const html = await fetchText(url)
      const parsed = parseListingPage(html, url)
      if (!parsed) {
        skipped.push(slug)
        log(`  ! listing ${slug}: could not parse page`)
        continue
      }

      const galleryIds: number[] = []
      for (const imageUrl of parsed.images) {
        const id = await importImage(payload, imageUrl, parsed.name, log)
        if (id) galleryIds.push(id)
      }

      const catIds = [
        ...new Set(
          parsed.categorySlugs
            .map((raw) => canonicalCategorySlug(raw))
            .map((canonical) => categoryIds.get(canonical))
            .filter((id): id is number => typeof id === 'number'),
        ),
      ]
      const areaId = parsed.regionSlug
        ? areaIds.get(canonicalRegionSlug(parsed.regionSlug) ?? '') ?? null
        : null

      for (const [rawSlug, cleanName] of Object.entries(parsed.categoryNames)) {
        harvested.categories.set(canonicalCategorySlug(rawSlug), cleanName)
      }
      if (parsed.regionSlug && parsed.regionName) {
        const canonical = canonicalRegionSlug(parsed.regionSlug)
        if (canonical) harvested.areas.set(canonical, parsed.regionName)
      }

      await upsertBySlug(payload, 'listings', slug, {
        name: parsed.name,
        categories: catIds,
        primaryCategory: catIds[0] ?? null,
        area: areaId,
        excerpt: parsed.excerpt || undefined,
        description: parsed.descriptionHtml
          ? htmlToLexical(parsed.descriptionHtml)
          : undefined,
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
        sourceUrl: url,
      })
      imported += 1
      log(`  ✓ listing ${index + 1}/${urls.length} ${slug} (${galleryIds.length} images)`)
    } catch (error) {
      skipped.push(slug)
      log(`  ! listing ${slug} failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  return { imported, skipped, harvested }
}

// Convert article HTML to Lexical, interleaving upload nodes where the
// original had inline images so articles keep their pictures.
export async function lexicalWithInlineImages(
  payload: Payload,
  htmlToLexical: HtmlToLexical,
  contentHtml: string,
  alt: string,
  log: Log,
): Promise<LexicalState> {
  const imageUrls = [
    ...new Set(
      [...contentHtml.matchAll(/<img[^>]+src="([^"]+)"/gi)]
        .map((match) => originalImageUrl(decodeEntities(match[1])))
        .filter((src) => /wp-content\/uploads/.test(src)),
    ),
  ].slice(0, MAX_POST_INLINE_IMAGES)

  const chunks = contentHtml.split(/<img[^>]*>/i)
  const state = emptyLexical()
  for (const [chunkIndex, chunk] of chunks.entries()) {
    if (stripTags(chunk)) {
      const part = htmlToLexical(chunk)
      state.root.children.push(...part.root.children)
    }
    if (chunkIndex < chunks.length - 1 && chunkIndex < imageUrls.length) {
      const mediaId = await importImage(payload, imageUrls[chunkIndex], alt, log)
      if (mediaId) state.root.children.push(uploadNode(mediaId))
    }
  }
  return state
}

async function importPosts(
  payload: Payload,
  htmlToLexical: HtmlToLexical,
  log: Log,
): Promise<number> {
  const wpPosts = await fetchAllRestPages(`${WP}/wp-json/wp/v2/posts?status=publish`, POST_LIMIT)
  log(`posts: ${wpPosts.length} to import`)

  let imported = 0
  for (const [index, wp] of wpPosts.entries()) {
    const slug = decodeURIComponent(wp.slug).toLowerCase()
    try {
      const title = stripTags(wp.title?.rendered || slug)
      const excerpt = clip(stripTags(wp.excerpt?.rendered || ''), 300)
      const contentHtml = cleanWordPressHtml(wp.content?.rendered || '')

      // Featured image via the media endpoint
      let featuredImageId: number | null = null
      if (wp.featured_media) {
        try {
          const media = (await fetchJson(
            `${WP}/wp-json/wp/v2/media/${wp.featured_media}`,
          )) as Record<string, any>
          if (media?.source_url) {
            featuredImageId = await importImage(payload, media.source_url, title, log)
          }
        } catch {
          // featured image is optional
        }
      }

      const state = await lexicalWithInlineImages(payload, htmlToLexical, contentHtml, title, log)
      if (state.root.children.length === 0) state.root.children.push(paragraphNode(excerpt || title))

      await upsertBySlug(payload, 'posts', slug, {
        title,
        excerpt: excerpt || undefined,
        content: state,
        ...(featuredImageId ? { featuredImage: featuredImageId } : {}),
        publishedAt: wp.date_gmt ? `${wp.date_gmt}Z` : undefined,
        language: detectLanguage(`${title} ${excerpt}`),
        sourceUrl: wp.link,
      })
      imported += 1
      if ((index + 1) % 20 === 0) log(`  … posts ${index + 1}/${wpPosts.length}`)
    } catch (error) {
      log(`  ! post ${slug} failed: ${error instanceof Error ? error.message : error}`)
    }
  }
  log(`  ✓ posts imported: ${imported}`)
  return imported
}

// Flag homepage content and build navigation once real counts are known
async function finalize(
  payload: Payload,
  categoryIds: Map<string, number>,
  areaIds: Map<string, number>,
  harvested: HarvestedNames,
  log: Log,
): Promise<void> {
  // Prefer the clean term names harvested from listing badges over whatever
  // the term archive pages exposed (often custom SEO titles)
  for (const [slug, name] of harvested.categories) {
    const id = categoryIds.get(slug)
    if (id && name) await payload.update({ collection: 'categories', id, data: { name } })
  }
  for (const [slug, name] of harvested.areas) {
    const id = areaIds.get(slug)
    if (id && name) await payload.update({ collection: 'areas', id, data: { name } })
  }
  if (harvested.categories.size || harvested.areas.size) {
    log(
      `harvested clean names: ${harvested.categories.size} categories, ${harvested.areas.size} areas`,
    )
  }
  // Reset placement flags so re-runs never leave stale homepage content
  await payload.update({
    collection: 'categories',
    where: { showOnHomepage: { equals: true } },
    data: { showOnHomepage: false },
  })
  await payload.update({
    collection: 'areas',
    where: { featured: { equals: true } },
    data: { featured: false },
  })
  await payload.update({
    collection: 'listings',
    where: { featured: { equals: true } },
    data: { featured: false },
  })

  const counts = new Map<string, number>()
  for (const [slug, id] of categoryIds) {
    const { totalDocs } = await payload.count({
      collection: 'listings',
      where: { categories: { contains: id } },
    })
    counts.set(slug, totalDocs)
  }

  const topCategories = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  for (const [index, [slug]] of topCategories.entries()) {
    await payload.update({
      collection: 'categories',
      id: categoryIds.get(slug)!,
      data: { showOnHomepage: true, order: index },
    })
  }
  log(`homepage categories: ${topCategories.map(([slug]) => slug).join(', ')}`)

  const areaCounts: [string, number][] = []
  for (const [slug, id] of areaIds) {
    const { totalDocs } = await payload.count({
      collection: 'listings',
      where: { area: { equals: id } },
    })
    areaCounts.push([slug, totalDocs])
  }
  const topAreas = areaCounts
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  for (const [index, [slug]] of topAreas.entries()) {
    await payload.update({
      collection: 'areas',
      id: areaIds.get(slug)!,
      data: { featured: true, order: index },
    })
  }
  log(`featured areas: ${topAreas.map(([slug]) => slug).join(', ')}`)

  // Featured listings: the ones with the richest galleries, spread across
  // categories so the homepage carousel is varied
  const { docs: withGalleries } = await payload.find({
    collection: 'listings',
    where: { published: { equals: true } },
    limit: 500,
    depth: 0,
  })
  const byCategory = new Map<number, { id: number; images: number }[]>()
  for (const listing of withGalleries) {
    const primary =
      typeof listing.primaryCategory === 'number' ? listing.primaryCategory : undefined
    const gallery = Array.isArray(listing.gallery) ? listing.gallery.length : 0
    if (!primary || gallery === 0) continue
    if (!byCategory.has(primary)) byCategory.set(primary, [])
    byCategory.get(primary)!.push({ id: listing.id, images: gallery })
  }
  const featuredIds: number[] = []
  for (const group of byCategory.values()) {
    group.sort((a, b) => b.images - a.images)
    if (group[0]) featuredIds.push(group[0].id)
    if (featuredIds.length >= 10) break
  }
  for (const [index, id] of featuredIds.entries()) {
    await payload.update({
      collection: 'listings',
      id,
      data: { featured: true, order: index },
    })
  }
  log(`featured listings: ${featuredIds.length}`)

  // Navigation from the per-site plan (skip slugs without listings)
  const navGroups = site.navPlan
    .map((group) => ({
      title: group.title,
      links: group.categorySlugs
        .filter((slug) => (counts.get(slug) ?? 0) > 0)
        .map((slug) => ({ label: '', category: categoryIds.get(slug)! , slug })),
    }))
    .filter((group) => group.links.length > 0)

  // Resolve labels from the stored category names
  type NavLinkSeed = { label: string; category?: number; area?: number }
  type NavGroupSeed = { title: string; links: NavLinkSeed[] }
  const resolvedGroups: NavGroupSeed[] = []
  for (const group of navGroups) {
    const links: NavLinkSeed[] = []
    for (const link of group.links) {
      const category = await payload.findByID({
        collection: 'categories',
        id: link.category,
        depth: 0,
      })
      links.push({ label: category.name, category: link.category })
    }
    resolvedGroups.push({ title: group.title, links })
  }

  // Areas menu group
  if (topAreas.length > 0) {
    const areaLinks: NavLinkSeed[] = []
    for (const [slug] of topAreas) {
      const area = await payload.findByID({
        collection: 'areas',
        id: areaIds.get(slug)!,
        depth: 0,
      })
      areaLinks.push({ label: area.name, area: area.id })
    }
    resolvedGroups.push({ title: 'Areas', links: areaLinks })
  }

  // Hero image: reuse the old homepage og:image if available
  let heroImageId: number | null = null
  try {
    const homeHtml = await fetchText(`${WP}/`)
    const ogImage = metaContent(homeHtml, 'og:image')
    if (ogImage) heroImageId = await importImage(payload, ogImage, site.tagline, log)
  } catch {
    // hero image is optional
  }

  const existing = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: existing.siteName || site.name,
      tagline: existing.tagline || site.tagline,
      heroTitle: existing.heroTitle || site.tagline,
      ...(heroImageId && !existing.heroImage ? { heroImage: heroImageId } : {}),
      navGroups: resolvedGroups,
      exploreLinks:
        existing.exploreLinks && existing.exploreLinks.length > 0
          ? existing.exploreLinks
          : site.network.map((item) => ({ name: item.name, url: item.url })),
      contactEmail: existing.contactEmail || site.defaultContact.email,
      contactPhone: existing.contactPhone || site.defaultContact.phone,
      seoTitle: existing.seoTitle || `${site.name} — ${site.tagline}`,
      seoDescription: existing.seoDescription || site.description,
    },
  })
  log('site settings updated (nav, explore links, contact, SEO defaults)')
}

// ------------------------- taxonomy cover images ---------------------------

// The old WordPress sites never set term images, so category and area covers
// come from their own content: each term without an image gets the lead
// gallery photo of its strongest listing (featured first, then largest
// gallery), no photo serving two terms. Manual choices in the CMS are kept.
export async function assignTaxonomyImages(
  payload: Payload,
  log: Log,
): Promise<{ categories: number; areas: number }> {
  const { docs: listings } = await payload.find({
    collection: 'listings',
    where: { published: { equals: true } },
    limit: 5000,
    depth: 0,
  })

  const asId = (value: unknown): number | null =>
    typeof value === 'number'
      ? value
      : value && typeof value === 'object' && 'id' in value
        ? ((value as { id: number }).id ?? null)
        : null

  const ranked = [...listings].sort((a, b) => {
    const rank = (l: (typeof listings)[number]) =>
      (l.featured ? 1000 : 0) + Math.min(999, l.gallery?.length ?? 0)
    return rank(b) - rank(a)
  })

  const byCategory = new Map<number, typeof ranked>()
  const byArea = new Map<number, typeof ranked>()
  for (const listing of ranked) {
    for (const category of listing.categories ?? []) {
      const id = asId(category)
      if (id === null) continue
      if (!byCategory.has(id)) byCategory.set(id, [])
      byCategory.get(id)!.push(listing)
    }
    const areaId = asId(listing.area)
    if (areaId !== null) {
      if (!byArea.has(areaId)) byArea.set(areaId, [])
      byArea.get(areaId)!.push(listing)
    }
  }

  const usedMedia = new Set<number>()
  const pickImage = (candidates: typeof ranked | undefined): number | null => {
    for (const listing of candidates ?? []) {
      for (const item of listing.gallery ?? []) {
        const mediaId = asId(item)
        if (mediaId !== null && !usedMedia.has(mediaId)) {
          usedMedia.add(mediaId)
          return mediaId
        }
      }
    }
    return null
  }

  let categoriesSet = 0
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 500,
    depth: 0,
    sort: 'order',
  })
  for (const category of categories) {
    const current = asId(category.image)
    if (current !== null) {
      usedMedia.add(current)
      continue
    }
    const mediaId = pickImage(byCategory.get(category.id))
    if (mediaId === null) continue
    await payload.update({
      collection: 'categories',
      id: category.id,
      data: { image: mediaId },
    })
    categoriesSet += 1
    log(`  ✓ category image: ${category.slug}`)
  }

  let areasSet = 0
  const { docs: areas } = await payload.find({
    collection: 'areas',
    limit: 500,
    depth: 0,
    sort: 'order',
  })
  for (const area of areas) {
    const current = asId(area.image)
    if (current !== null) {
      usedMedia.add(current)
      continue
    }
    const mediaId = pickImage(byArea.get(area.id))
    if (mediaId === null) continue
    await payload.update({ collection: 'areas', id: area.id, data: { image: mediaId } })
    areasSet += 1
    log(`  ✓ area image: ${area.slug}`)
  }

  log(`taxonomy images assigned: ${categoriesSet} categories, ${areasSet} areas`)
  return { categories: categoriesSet, areas: areasSet }
}

export const startBackgroundTaxonomyImages = (payload: Payload): boolean => {
  if (status.state === 'running') return false
  status.state = 'running'
  status.startedAt = new Date().toISOString()
  status.finishedAt = undefined
  status.error = undefined

  const log: Log = (message) => {
    payload.logger.info(`[wp-import] ${message}`)
    status.lastMessage = message
    status.recentLog.push(`${new Date().toISOString()} ${message}`)
    if (status.recentLog.length > 300) status.recentLog.splice(0, 100)
  }

  void assignTaxonomyImages(payload, log)
    .then(() => {
      status.state = 'done'
      status.finishedAt = new Date().toISOString()
    })
    .catch((error) => {
      status.state = 'error'
      status.error = error instanceof Error ? error.message : String(error)
      status.finishedAt = new Date().toISOString()
    })
  return true
}

// ------------------------------ media refetch ------------------------------

// Re-download every media file from its original WordPress URL and store it
// again through the active storage adapter. For recovering after files were
// lost (e.g. written to an ephemeral disk): documents, ids, filenames and
// relationships stay untouched — only the binaries and generated sizes are
// replaced.
export async function refetchMedia(
  payload: Payload,
  log: Log,
): Promise<{ refreshed: number; failed: number; skipped: number }> {
  let refreshed = 0
  let failed = 0
  let skipped = 0
  let page = 1
  log('media refetch: starting')
  for (;;) {
    const result = await payload.find({
      collection: 'media',
      limit: 100,
      page,
      depth: 0,
      sort: 'id',
    })
    for (const doc of result.docs) {
      if (!doc.sourceUrl) {
        skipped += 1
        continue
      }
      try {
        const data = await fetchBuffer(doc.sourceUrl)
        const name =
          doc.filename || decodeURIComponent(doc.sourceUrl.split('/').pop() || 'image.jpg')
        await payload.update({
          collection: 'media',
          id: doc.id,
          data: {},
          file: { data, name, mimetype: mimeFor(name.toLowerCase()), size: data.length },
          overwriteExistingFiles: true,
        })
        refreshed += 1
        if (refreshed % 25 === 0) log(`  … media refreshed ${refreshed}`)
      } catch (error) {
        failed += 1
        log(
          `    ! media refetch failed #${doc.id} ${doc.sourceUrl}: ${error instanceof Error ? error.message : error}`,
        )
      }
    }
    if (!result.hasNextPage) break
    page += 1
  }
  log(`media refetch done: ${refreshed} refreshed, ${failed} failed, ${skipped} without source`)
  return { refreshed, failed, skipped }
}

// --------------------------------- runner ----------------------------------

export async function runWordPressImport(payload: Payload, log: Log): Promise<ImportSummary> {
  mediaFailures = 0
  log(`starting import from ${WP}`)

  const htmlToLexical = await makeHtmlToLexical(payload)

  const categoryIds = await importCategories(payload, log)
  const areaIds = await importAreas(payload, log)
  const { imported: listings, skipped, harvested } = await importListings(
    payload,
    htmlToLexical,
    categoryIds,
    areaIds,
    log,
  )
  const posts = await importPosts(payload, htmlToLexical, log)
  await finalize(payload, categoryIds, areaIds, harvested, log)
  await assignTaxonomyImages(payload, log)

  const summary: ImportSummary = {
    categories: categoryIds.size,
    areas: areaIds.size,
    listings,
    posts,
    mediaFailures,
    skipped,
  }
  log(`done: ${JSON.stringify(summary)}`)
  return summary
}
