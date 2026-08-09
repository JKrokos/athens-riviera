import type { Metadata } from 'next'

import { AreaCard } from '../../../components/cards/AreaCard'
import { CategoryCard } from '../../../components/cards/CategoryCard'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { SectionHeading } from '../../../components/ui/SectionHeading'
import { countListingsForCategories, getAllCategories, getAreas } from '../../../lib/data'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: `Explore ${site.place.name}`,
  description: `Browse every category and neighbourhood on ${site.name} — hotels, restaurants, shopping, nightlife, experiences and more across ${site.place.name}.`,
  path: '/explore',
})

export default async function ExplorePage() {
  const [categories, areas] = await Promise.all([getAllCategories(), getAreas()])
  const counts = await countListingsForCategories(categories.map((category) => category.id))
  const withListings = categories.filter((category) => (counts[category.id] ?? 0) > 0)

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumbs items={[{ name: 'Explore' }]} />
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
        Explore {site.place.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Every category and neighbourhood we cover — pick a direction and dive in.
      </p>

      <section className="mt-12">
        <SectionHeading kicker="Categories" title="By interest" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {withListings.map((category) => (
            <CategoryCard key={category.id} category={category} count={counts[category.id]} />
          ))}
        </div>
      </section>

      {areas.length > 0 ? (
        <section className="mt-16">
          <SectionHeading kicker="Neighbourhoods" title="By area" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
