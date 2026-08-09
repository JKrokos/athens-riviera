import type { Metadata } from 'next'

import { BlogIndex } from './BlogIndex'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description: `Stories, guides and news from ${site.place.name} — insider tips on where to stay, eat, shop and explore.`,
  path: '/blog',
})

export default function BlogPage() {
  return <BlogIndex page={1} />
}
