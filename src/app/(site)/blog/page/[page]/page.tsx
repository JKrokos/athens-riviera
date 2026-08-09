import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { BlogIndex } from '../../BlogIndex'
import { POSTS_PER_PAGE, getPosts } from '../../../../../lib/data'
import { getPayloadClient } from '../../../../../lib/payloadClient'
import { buildMetadata } from '../../../../../lib/seo'
import { site } from '../../../../../site.config'

type Params = { page: string }

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const payload = await getPayloadClient()
    const { totalDocs } = await payload.count({ collection: 'posts' })
    const totalPages = Math.max(1, Math.ceil(totalDocs / POSTS_PER_PAGE))
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
      page: String(index + 2),
    }))
  } catch {
    // DB unreachable at build time — pages render on demand at runtime
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { page } = await params
  return buildMetadata({
    title: `Blog — page ${page}`,
    description: `Stories, guides and news from ${site.place.name} — page ${page}.`,
    path: `/blog/page/${page}`,
  })
}

export default async function BlogPagedPage({ params }: { params: Promise<Params> }) {
  const { page: pageParam } = await params
  const page = Number.parseInt(pageParam, 10)
  if (!Number.isFinite(page) || page < 1) notFound()
  if (page === 1) redirect('/blog')

  const { totalPages } = await getPosts(page)
  if (page > totalPages) notFound()

  return <BlogIndex page={page} />
}
