import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { FilterableListingGrid } from '../../../../components/FilterableListingGrid'
import { JsonLd } from '../../../../components/seo/JsonLd'
import { getAllCategories, getCategoryBySlug, getListings } from '../../../../lib/data'
import { toListingCardData } from '../../../../lib/dto'
import { mediaAlt, mediaUrl } from '../../../../lib/media'
import { categoryMeta, collectionPageJsonLd } from '../../../../lib/seo'
import { site } from '../../../../site.config'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const categories = await getAllCategories()
  return categories
    .map((category) => category.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(decodeURIComponent(slug))
  if (!category) return {}
  return categoryMeta(category)
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(decodeURIComponent(slug))
  if (!category) notFound()

  const listings = await getListings({ categoryId: category.id })
  const imageUrl = mediaUrl(category.image, 'hero')
  const parent = typeof category.parent === 'object' ? category.parent : undefined

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: `Best ${category.name} in ${site.place.name}`,
          description: category.description,
          path: `/category/${category.slug}`,
          itemUrls: listings.map((listing) => `/listing/${listing.slug}`),
        })}
      />

      <section className="relative isolate overflow-hidden bg-ink text-white">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={mediaAlt(category.image, category.name)}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/30" />
        <div className="container-site relative py-16 sm:py-24">
          <p className="kicker mb-3 !text-accent">
            {site.place.name} · {listings.length} place{listings.length === 1 ? '' : 's'}
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-bold sm:text-5xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-4 max-w-2xl text-lg text-white/85">{category.description}</p>
          ) : null}
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <Breadcrumbs
          items={[
            ...(parent ? [{ name: parent.name, path: `/category/${parent.slug}` }] : []),
            { name: category.name },
          ]}
        />
        <FilterableListingGrid listings={listings.map(toListingCardData)} />
      </section>
    </>
  )
}
