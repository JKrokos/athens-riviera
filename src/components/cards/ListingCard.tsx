import Image from 'next/image'
import Link from 'next/link'

import { MapPinIcon } from '../ui/Icons'
import type { ListingCardData } from '../../lib/dto'

export function ListingCard({ data, priority }: { data: ListingCardData; priority?: boolean }) {
  return (
    <article className="card group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-accent-soft">
        {data.coverUrl ? (
          <Image
            src={data.coverUrl}
            alt={data.coverAlt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-accent/50">
            {data.name.charAt(0)}
          </div>
        )}
        {data.categoryName ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
            {data.categoryName}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">
          <Link
            href={`/listing/${data.slug}`}
            className="after:absolute after:inset-0 hover:text-accent-strong"
          >
            {data.name}
          </Link>
        </h3>
        {data.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{data.excerpt}</p>
        ) : null}
        {data.areaName ? (
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-sm text-muted">
            <MapPinIcon width={16} height={16} className="text-accent" />
            {data.areaName}
          </p>
        ) : null}
      </div>
    </article>
  )
}
