import Image from 'next/image'
import Link from 'next/link'

import { mediaAlt, mediaUrl } from '../../lib/media'
import type { Area } from '../../payload-types'

export function AreaCard({ area }: { area: Area }) {
  const imageUrl = mediaUrl(area.image, 'card')

  return (
    <Link
      href={`/region/${area.slug}`}
      className="card group relative block aspect-[16/10] text-white"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={mediaAlt(area.image, area.name)}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink to-ink/60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-xl font-semibold">{area.name}</h3>
        {area.description ? (
          <p className="mt-1 line-clamp-1 text-sm text-white/80">{area.description}</p>
        ) : null}
      </div>
    </Link>
  )
}
