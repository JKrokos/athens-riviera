import type { Metadata } from 'next'
import Link from 'next/link'

import { ListingCard } from '../../../components/cards/ListingCard'
import { PostCard } from '../../../components/cards/PostCard'
import { SearchIcon } from '../../../components/ui/Icons'
import { searchSite } from '../../../lib/data'
import { toListingCardData } from '../../../lib/dto'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: `Search ${site.name} for hotels, restaurants, shops, areas and stories across ${site.place.name}.`,
  path: '/search',
  noIndex: true,
})

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const { q } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? ''
  const results = query ? await searchSite(query) : null
  const totalResults = results
    ? results.listings.length + results.posts.length + results.categories.length + results.areas.length
    : 0

  return (
    <div className="container-site py-10 sm:py-14">
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">Search</h1>

      <form action="/search" className="mt-6 flex max-w-xl overflow-hidden rounded-full border border-line bg-surface p-1.5 shadow-card">
        <label htmlFor="search-input" className="sr-only">
          Search
        </label>
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Hotels, restaurants, areas…"
          className="w-full bg-transparent px-5 text-ink placeholder:text-muted focus:outline-none"
        />
        <button type="submit" className="btn-primary shrink-0">
          <SearchIcon width={18} height={18} />
          Search
        </button>
      </form>

      {results === null ? (
        <p className="mt-10 text-ink-soft">Type what you’re looking for and hit search.</p>
      ) : totalResults === 0 ? (
        <p className="mt-10 rounded-card border border-line bg-surface p-8 text-ink-soft">
          Nothing found for <strong className="text-ink">“{query}”</strong>. Try a different
          spelling or browse <Link href="/explore" className="font-medium text-accent-strong underline">all categories</Link>.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          {results.categories.length > 0 || results.areas.length > 0 ? (
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
                Categories &amp; areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((category) => (
                  <Link key={`c${category.id}`} href={`/category/${category.slug}`} className="chip">
                    {category.name}
                  </Link>
                ))}
                {results.areas.map((area) => (
                  <Link key={`a${area.id}`} href={`/region/${area.slug}`} className="chip">
                    {area.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {results.listings.length > 0 ? (
            <section>
              <h2 className="mb-6 font-display text-2xl font-semibold text-ink">
                Places ({results.listings.length})
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.listings.map((listing) => (
                  <ListingCard key={listing.id} data={toListingCardData(listing)} />
                ))}
              </div>
            </section>
          ) : null}

          {results.posts.length > 0 ? (
            <section>
              <h2 className="mb-6 font-display text-2xl font-semibold text-ink">
                Articles ({results.posts.length})
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
