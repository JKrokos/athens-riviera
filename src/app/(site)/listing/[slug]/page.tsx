import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { ListingCard } from '../../../../components/cards/ListingCard'
import { RichTextContent } from '../../../../components/RichTextContent'
import { ContactPanel } from '../../../../components/listing/ContactPanel'
import { Gallery, type GalleryImage } from '../../../../components/listing/Gallery'
import { MapEmbed } from '../../../../components/listing/MapEmbed'
import { JsonLd } from '../../../../components/seo/JsonLd'
import { SectionHeading } from '../../../../components/ui/SectionHeading'
import { MapPinIcon } from '../../../../components/ui/Icons'
import Link from 'next/link'
import {
  getAllListingSlugs,
  getListingBySlug,
  getRelatedListings,
} from '../../../../lib/data'
import { toListingCardData } from '../../../../lib/dto'
import { asMedia, mediaAlt, mediaUrl } from '../../../../lib/media'
import { buildMetadata, listingJsonLd } from '../../../../lib/seo'
import { site } from '../../../../site.config'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllListingSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const listing = await getListingBySlug(decodeURIComponent(slug))
  if (!listing) return {}
  const category =
    typeof listing.primaryCategory === 'object' ? listing.primaryCategory : undefined
  return buildMetadata({
    title: `${listing.name}${category ? ` — ${category.name}` : ''}`,
    description:
      listing.excerpt ||
      `${listing.name} in ${site.place.name}: photos, contact details, location and more.`,
    path: `/listing/${listing.slug}`,
    image: mediaUrl(listing.gallery?.[0], 'card'),
  })
}

export default async function ListingPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const listing = await getListingBySlug(decodeURIComponent(slug))
  if (!listing) notFound()

  const related = await getRelatedListings(listing)
  const category =
    typeof listing.primaryCategory === 'object' && listing.primaryCategory
      ? listing.primaryCategory
      : undefined
  const area = typeof listing.area === 'object' && listing.area ? listing.area : undefined

  const images: GalleryImage[] = (listing.gallery ?? [])
    .map((item) => {
      const media = asMedia(item)
      const url = mediaUrl(media, 'card')
      if (!url) return null
      return {
        url,
        largeUrl: mediaUrl(media, 'hero') ?? url,
        alt: mediaAlt(media, listing.name),
      }
    })
    .filter((image): image is GalleryImage => image !== null)

  const hasCoordinates = Boolean(listing.location?.latitude && listing.location?.longitude)

  return (
    <article className="container-site py-8 sm:py-10">
      <JsonLd data={listingJsonLd(listing)} />
      <Breadcrumbs
        items={[
          ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
          { name: listing.name },
        ]}
      />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-5xl">{listing.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(listing.categories ?? [])
            .filter((item): item is Exclude<typeof item, number> => typeof item === 'object')
            .map((item) => (
              <Link key={item.id} href={`/category/${item.slug}`} className="chip">
                {item.name}
              </Link>
            ))}
          {area ? (
            <Link href={`/region/${area.slug}`} className="chip">
              <MapPinIcon width={15} height={15} className="text-accent" />
              {area.name}
            </Link>
          ) : null}
        </div>
      </header>

      <Gallery images={images} name={listing.name} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {!listing.description && listing.excerpt ? (
            <p className="mb-6 text-lg font-medium leading-relaxed text-ink">{listing.excerpt}</p>
          ) : null}
          <RichTextContent data={listing.description} />
        </div>
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ContactPanel listing={listing} />
          {hasCoordinates ? (
            <MapEmbed
              lat={listing.location!.latitude!}
              lng={listing.location!.longitude!}
              name={listing.name}
            />
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <SectionHeading
            kicker="Nearby & similar"
            title={category ? `More ${category.name}` : 'You may also like'}
            link={category ? { label: `All ${category.name}`, href: `/category/${category.slug}` } : undefined}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ListingCard key={item.id} data={toListingCardData(item)} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
