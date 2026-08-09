import type { Media } from '../payload-types'

type MediaSize = 'thumb' | 'card' | 'hero'

export type MediaRef = number | Media | null | undefined

export const asMedia = (ref: MediaRef): Media | undefined =>
  ref && typeof ref === 'object' ? ref : undefined

// Payload returns absolute URLs based on serverURL; same-origin media should
// be a relative path so next/image accepts it in every environment
// (localhost, Railway preview domain, production domain).
const relativize = (url: string): string => {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  if (serverUrl && url.startsWith(serverUrl)) return url.slice(serverUrl.length) || '/'
  if (url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/payload-api/')) return parsed.pathname + parsed.search
  } catch {
    // not a URL — return as-is
  }
  return url
}

// URL for a media document, preferring the requested generated size and
// falling back to the next larger one, then the original upload.
export const mediaUrl = (ref: MediaRef, size?: MediaSize): string | undefined => {
  const media = asMedia(ref)
  if (!media) return undefined
  if (size) {
    const order: MediaSize[] =
      size === 'thumb' ? ['thumb', 'card', 'hero'] : size === 'card' ? ['card', 'hero'] : ['hero']
    for (const name of order) {
      const url = media.sizes?.[name]?.url
      if (url) return relativize(url)
    }
  }
  return media.url ? relativize(media.url) : undefined
}

export const mediaAlt = (ref: MediaRef, fallback: string): string =>
  asMedia(ref)?.alt || fallback
