import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { ListingCard } from '../../../../components/cards/ListingCard'
import { JsonLd } from '../../../../components/seo/JsonLd'
import { getAreaBySlug, getAreas, getListings } from '../../../../lib/data'
import { toListingCardData } from '../../../../lib/dto'
import { mediaAlt, mediaUrl } from '../../../../lib/media'
import { areaMeta, collectionPageJsonLd } from '../../../../lib/seo'
import { site } from '../../../../site.config'
import type { Listing } from '../../../../payload-types'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const areas = await getAreas()
  return areas
    .map((area) => area.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const area = await getAreaBySlug(decodeURIComponent(slug))
  if (!area) return {}
  return areaMeta(area)
}

const groupByCategory = (listings: Listing[]): { name: string; listings: Listing[] }[] => {
  const groups = new Map<string, { name: string; listings: Listing[] }>()
  for (const listing of listings) {
    const category =
      typeof listing.primaryCategory === 'object' && listing.primaryCategory
        ? listing.primaryCategory
        : undefined
    const key = category?.name ?? 'More places'
    if (!groups.has(key)) groups.set(key, { name: key, listings: [] })
    groups.get(key)!.listings.push(listing)
  }
  return [...groups.values()].sort((a, b) => b.listings.length - a.listings.length)
}

export default async function AreaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const area = await getAreaBySlug(decodeURIComponent(slug))
  if (!area) notFound()

  const listings = await getListings({ areaId: area.id })
  const groups = groupByCategory(listings)
  const imageUrl = mediaUrl(area.image, 'hero')

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: `${area.name} — places to visit`,
          description: area.description,
          path: `/region/${area.slug}`,
          itemUrls: listings.map((listing) => `/listing/${listing.slug}`),
        })}
      />

      <section className="relative isolate overflow-hidden bg-ink text-white">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={mediaAlt(area.image, area.name)}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/30" />
        <div className="container-site relative py-16 sm:py-24">
          <p className="kicker mb-3 !text-accent">
            {site.place.name} neighbourhood · {listings.length} place
            {listings.length === 1 ? '' : 's'}
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-bold sm:text-5xl">{area.name}</h1>
          {area.description ? (
            <p className="mt-4 max-w-2xl text-lg text-white/85">{area.description}</p>
          ) : null}
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <Breadcrumbs items={[{ name: area.name }]} />
        {groups.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-8 text-center text-ink-soft">
            No places listed in {area.name} yet — check back soon.
          </p>
        ) : (
          <div className="space-y-14">
            {groups.map((group) => (
              <div key={group.name}>
                <h2 className="mb-6 font-display text-2xl font-semibold text-ink">{group.name}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.listings.map((listing) => (
                    <ListingCard key={listing.id} data={toListingCardData(listing)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
