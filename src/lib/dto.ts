import { mediaAlt, mediaUrl } from './media'
import type { Listing } from '../payload-types'

// Lightweight serializable shape for listing cards — safe to pass into
// client components without dragging whole Payload documents along.
export type ListingCardData = {
  slug: string
  name: string
  excerpt?: string
  coverUrl?: string
  coverAlt: string
  categoryName?: string
  areaName?: string
  areaSlug?: string
}

export const toListingCardData = (listing: Listing): ListingCardData => {
  const cover = listing.gallery?.[0]
  const category =
    typeof listing.primaryCategory === 'object' && listing.primaryCategory
      ? listing.primaryCategory
      : undefined
  const area = typeof listing.area === 'object' && listing.area ? listing.area : undefined

  return {
    slug: listing.slug ?? '',
    name: listing.name,
    excerpt: listing.excerpt ?? undefined,
    coverUrl: mediaUrl(cover, 'card'),
    coverAlt: mediaAlt(cover, listing.name),
    categoryName: category?.name,
    areaName: area?.name,
    areaSlug: area?.slug ?? undefined,
  }
}
