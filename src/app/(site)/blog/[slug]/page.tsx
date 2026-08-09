import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { PostCard } from '../../../../components/cards/PostCard'
import { RichTextContent } from '../../../../components/RichTextContent'
import { JsonLd } from '../../../../components/seo/JsonLd'
import { SectionHeading } from '../../../../components/ui/SectionHeading'
import { getAllPostSlugs, getPostBySlug, getRecentPosts } from '../../../../lib/data'
import { formatDate } from '../../../../lib/format'
import { mediaAlt, mediaUrl } from '../../../../lib/media'
import { articleJsonLd, buildMetadata } from '../../../../lib/seo'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(decodeURIComponent(slug))
  if (!post) return {}
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: mediaUrl(post.featuredImage, 'hero'),
    type: 'article',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const post = await getPostBySlug(decodeURIComponent(slug))
  if (!post) notFound()

  const related = (await getRecentPosts(4)).filter((item) => item.id !== post.id).slice(0, 3)
  const imageUrl = mediaUrl(post.featuredImage, 'hero')

  return (
    <article className="container-site py-10 sm:py-14" lang={post.language === 'el' ? 'el' : undefined}>
      <JsonLd data={articleJsonLd(post)} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ name: 'Blog', path: '/blog' }, { name: post.title }]} />
        {post.publishedAt ? (
          <time dateTime={post.publishedAt} className="kicker">
            {formatDate(post.publishedAt)}
          </time>
        ) : null}
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="mt-4 text-lg font-medium leading-relaxed text-ink-soft">{post.excerpt}</p>
        ) : null}
      </div>

      {imageUrl ? (
        <figure className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-card">
          <Image
            src={imageUrl}
            alt={mediaAlt(post.featuredImage, post.title)}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </figure>
      ) : null}

      <div className="mx-auto mt-10 max-w-3xl">
        <RichTextContent data={post.content} />
      </div>

      {related.length > 0 ? (
        <section className="mx-auto mt-16 max-w-5xl">
          <SectionHeading kicker="Keep reading" title="More stories" link={{ label: 'All articles', href: '/blog' }} />
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
