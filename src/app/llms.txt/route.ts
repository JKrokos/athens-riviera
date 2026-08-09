import {
  countListingsForCategories,
  getAllCategories,
  getAreas,
  getListings,
  getRecentPosts,
  getSettings,
} from '../../lib/data'
import { absoluteUrl } from '../../lib/seo'
import { site } from '../../site.config'

export const revalidate = 3600

// llms.txt — a concise, plain-markdown map of the site for AI assistants and
// answer engines (see https://llmstxt.org). Generated from live content.
export async function GET(): Promise<Response> {
  const [settings, categories, areas, featured, posts] = await Promise.all([
    getSettings(),
    getAllCategories(),
    getAreas(),
    getListings({ featuredOnly: true, limit: 10 }),
    getRecentPosts(8),
  ])
  const counts = await countListingsForCategories(categories.map((category) => category.id))

  const lines: string[] = [
    `# ${settings.siteName || site.name}`,
    '',
    `> ${settings.seoDescription || site.description}`,
    '',
    `${site.name} is a curated destination guide for ${site.place.name}, ${site.place.countryName}. Every listed business has a profile page with photos, a description, contact details (phone, email, website), social links and its location. Content is in English.`,
    '',
    '## Categories',
    '',
    ...categories
      .filter((category) => (counts[category.id] ?? 0) > 0)
      .map(
        (category) =>
          `- [${category.name}](${absoluteUrl(`/category/${category.slug}`)}): ${
            counts[category.id]
          } curated place${counts[category.id] === 1 ? '' : 's'}${
            category.description ? ` — ${category.description}` : ''
          }`,
      ),
    '',
    '## Areas',
    '',
    ...areas.map(
      (area) =>
        `- [${area.name}](${absoluteUrl(`/region/${area.slug}`)})${
          area.description ? `: ${area.description}` : ''
        }`,
    ),
    '',
    '## Featured places',
    '',
    ...featured.map(
      (listing) =>
        `- [${listing.name}](${absoluteUrl(`/listing/${listing.slug}`)})${
          listing.excerpt ? `: ${listing.excerpt}` : ''
        }`,
    ),
    '',
    '## Recent articles',
    '',
    ...posts.map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)})`),
    '',
    '## Key pages',
    '',
    `- [Explore all categories and areas](${absoluteUrl('/explore')})`,
    `- [Blog](${absoluteUrl('/blog')})`,
    `- [About](${absoluteUrl('/about')})`,
    `- [Contact](${absoluteUrl('/contact')})`,
    `- [Promote your business](${absoluteUrl('/promote')})`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`,
    '',
    `Contact: ${settings.contactEmail || site.defaultContact.email}`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
