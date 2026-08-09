'use client'

import { useMemo, useState } from 'react'

import { ListingCard } from './cards/ListingCard'
import type { ListingCardData } from '../lib/dto'

// Client-side area filter: all listings are statically rendered and filtering
// only hides cards, so the page itself stays fully static (good for SEO).
export function FilterableListingGrid({ listings }: { listings: ListingCardData[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const areas = useMemo(() => {
    const map = new Map<string, string>()
    for (const listing of listings) {
      if (listing.areaSlug && listing.areaName) map.set(listing.areaSlug, listing.areaName)
    }
    return [...map.entries()].map(([slug, name]) => ({ slug, name }))
  }, [listings])

  const visible = selected
    ? listings.filter((listing) => listing.areaSlug === selected)
    : listings

  return (
    <div>
      {areas.length > 1 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`chip ${selected === null ? '!border-accent !bg-accent-soft !text-ink' : ''}`}
          >
            All areas
          </button>
          {areas.map((area) => (
            <button
              key={area.slug}
              type="button"
              onClick={() => setSelected(area.slug === selected ? null : area.slug)}
              className={`chip ${selected === area.slug ? '!border-accent !bg-accent-soft !text-ink' : ''}`}
            >
              {area.name}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((listing) => (
            <ListingCard key={listing.slug} data={listing} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-line bg-surface p-8 text-center text-ink-soft">
          No places in this area yet.
        </p>
      )}
    </div>
  )
}
