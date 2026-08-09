import Image from 'next/image'
import Link from 'next/link'

import { mediaAlt, mediaUrl } from '../../lib/media'
import { ArrowRightIcon } from '../ui/Icons'
import type { Category } from '../../payload-types'

export function CategoryCard({ category, count }: { category: Category; count?: number }) {
  const imageUrl = mediaUrl(category.image, 'card')

  return (
    <Link
      href={`/category/${category.slug}`}
      className="card group relative block aspect-[5/6] text-white"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={mediaAlt(category.image, category.name)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink to-ink/70" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight">{category.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/75">
          {typeof count === 'number' ? `${count} place${count === 1 ? '' : 's'}` : 'Explore'}
          <ArrowRightIcon
            width={14}
            height={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </p>
      </div>
    </Link>
  )
}
