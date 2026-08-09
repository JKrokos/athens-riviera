import Image from 'next/image'
import Link from 'next/link'

import { AreaCard } from '../../components/cards/AreaCard'
import { CategoryCard } from '../../components/cards/CategoryCard'
import { ListingCard } from '../../components/cards/ListingCard'
import { PostCard } from '../../components/cards/PostCard'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { ArrowRightIcon, SearchIcon } from '../../components/ui/Icons'
import {
  countListingsForCategories,
  getAreas,
  getHomepageCategories,
  getListings,
  getRecentPosts,
  getSettings,
} from '../../lib/data'
import { toListingCardData } from '../../lib/dto'
import { mediaAlt, mediaUrl } from '../../lib/media'
import { site } from '../../site.config'
import type { Post } from '../../payload-types'

export default async function HomePage() {
  const [settings, categories, featuredListings, featuredAreas, recentPosts] = await Promise.all([
    getSettings(),
    getHomepageCategories(),
    getListings({ featuredOnly: true, limit: 12 }),
    getAreas(true),
    getRecentPosts(4),
  ])
  const counts = await countListingsForCategories(categories.map((category) => category.id))

  const heroUrl = mediaUrl(settings.heroImage, 'hero')
  const featuredPost =
    settings.featuredPost && typeof settings.featuredPost === 'object'
      ? settings.featuredPost
      : undefined
  const posts: Post[] = featuredPost
    ? [featuredPost, ...recentPosts.filter((post) => post.id !== featuredPost.id)].slice(0, 4)
    : recentPosts
  const explore =
    settings.exploreLinks && settings.exploreLinks.length > 0
      ? settings.exploreLinks.map((link) => ({ name: link.name, url: link.url }))
      : site.network

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[72vh] items-center overflow-hidden bg-ink text-white">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={mediaAlt(settings.heroImage, `${site.place.name}, ${site.place.countryName}`)}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/95 to-accent-strong/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/25" />
        <div className="container-site relative py-24 sm:py-32">
          <p className="kicker mb-4 !text-accent-soft">
            {site.place.name}, {site.place.countryName}
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.1] sm:text-6xl">
            {settings.heroTitle || site.tagline}
          </h1>
          {settings.heroSubtitle ? (
            <p className="mt-5 max-w-xl text-lg text-white/85">{settings.heroSubtitle}</p>
          ) : null}

          <form action="/search" className="mt-9 flex max-w-xl overflow-hidden rounded-full bg-white p-1.5 shadow-card-hover">
            <label htmlFor="hero-search" className="sr-only">
              Search places
            </label>
            <input
              id="hero-search"
              type="search"
              name="q"
              placeholder="Search hotels, restaurants, shops…"
              className="w-full bg-transparent px-5 text-ink placeholder:text-muted focus:outline-none"
            />
            <button type="submit" className="btn-primary shrink-0">
              <SearchIcon width={18} height={18} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {categories.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white hover:text-ink"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="container-site pt-16 sm:pt-20">
          <SectionHeading
            kicker="Browse by category"
            title={`The best of ${site.place.name}`}
            link={{ label: 'All categories', href: '/explore' }}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => (
              <CategoryCard key={category.id} category={category} count={counts[category.id]} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured listings */}
      {featuredListings.length > 0 ? (
        <section className="container-site pt-16 sm:pt-20">
          <SectionHeading
            kicker="Hand-picked"
            title="Featured places"
            link={{ label: 'Explore everything', href: '/explore' }}
          />
          <div className="scroll-row">
            {featuredListings.map((listing) => (
              <div key={listing.id} className="w-[280px] shrink-0 sm:w-[320px]">
                <ListingCard data={toListingCardData(listing)} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Areas */}
      {featuredAreas.length > 0 ? (
        <section className="container-site pt-16 sm:pt-20">
          <SectionHeading kicker="Neighbourhoods" title="Best places to visit" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAreas.slice(0, 6).map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Blog */}
      {posts.length > 0 ? (
        <section className="container-site pt-16 sm:pt-20">
          <SectionHeading
            kicker="Stories & guides"
            title="Latest from the blog"
            link={{ label: 'All articles', href: '/blog' }}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {posts[0] ? (
              <div className="lg:col-span-2">
                <PostCard post={posts[0]} large />
              </div>
            ) : null}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {posts.slice(1, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Network */}
      <section className="container-site py-16 sm:py-20">
        <div className="rounded-card bg-footer-bg px-6 py-10 text-white sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="kicker mb-2">Keep exploring</p>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                More of Greece, by the same team
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {explore.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-sm font-medium transition-colors hover:bg-white hover:text-ink"
                >
                  {item.name}
                  <ArrowRightIcon
                    width={15}
                    height={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
