'use client'

import { useState } from 'react'

import { MapPinIcon } from '../ui/Icons'

// Click-to-load map: the Google Maps iframe (and its cookies) only loads
// after an explicit visitor action, keeping the page GDPR-friendly and fast.
export function MapEmbed({ lat, lng, name }: { lat: string; lng: string; name: string }) {
  const [loaded, setLoaded] = useState(false)

  const query = encodeURIComponent(`${lat},${lng}`)

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {loaded ? (
        <iframe
          title={`Map showing the location of ${name}`}
          src={`https://www.google.com/maps?q=${query}&z=15&output=embed`}
          className="h-72 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="flex h-72 w-full flex-col items-center justify-center gap-3 bg-accent-soft/50 text-ink-soft transition-colors hover:bg-accent-soft"
        >
          <MapPinIcon width={32} height={32} className="text-accent" />
          <span className="font-semibold text-ink">Show map</span>
          <span className="max-w-xs text-xs text-muted">
            Loads Google Maps, which may set third-party cookies.
          </span>
        </button>
      )}
    </div>
  )
}
