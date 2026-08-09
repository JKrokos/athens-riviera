import Image from 'next/image'
import Link from 'next/link'

import { mediaAlt, mediaUrl } from '../../lib/media'
import { formatDate } from '../../lib/format'
import type { Post } from '../../payload-types'

export function PostCard({ post, large }: { post: Post; large?: boolean }) {
  const imageUrl = mediaUrl(post.featuredImage, large ? 'hero' : 'card')

  return (
    <article
      className="card group relative flex h-full flex-col"
      lang={post.language === 'el' ? 'el' : undefined}
    >
      <div className={`relative overflow-hidden bg-accent-soft ${large ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={mediaAlt(post.featuredImage, post.title)}
            fill
            sizes={large ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-accent/30" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.publishedAt ? (
          <time dateTime={post.publishedAt} className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatDate(post.publishedAt)}
          </time>
        ) : null}
        <h3
          className={`mt-2 font-display font-semibold leading-snug text-ink ${large ? 'text-2xl' : 'text-lg'}`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 hover:text-accent-strong"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className={`mt-2 text-sm text-ink-soft ${large ? 'line-clamp-3' : 'line-clamp-2'}`}>
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </article>
  )
}
