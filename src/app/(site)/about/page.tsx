import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { getSettings } from '../../../lib/data'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: `About ${site.name}`,
  description: `Who is behind ${site.name} — a locally curated guide to the best of ${site.place.name}, part of a network of Greek travel guides.`,
  path: '/about',
})

export default async function AboutPage() {
  const settings = await getSettings()
  const name = settings.siteName || site.name
  const explore =
    settings.exploreLinks && settings.exploreLinks.length > 0
      ? settings.exploreLinks.map((link) => ({ name: link.name, url: link.url }))
      : site.network

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ name: 'About' }]} />
        <p className="kicker">About us</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">
          The local guide to {site.place.name}
        </h1>

        <div className="prose-site mt-8">
          <p>
            {name} is a curated city guide to {site.place.name}, {site.place.countryName}. We
            hand-pick the hotels, restaurants, bars, shops and experiences that we would recommend
            to our own friends — with photos, honest descriptions and all the practical details in
            one place.
          </p>
          <p>
            Our team lives and works here. We visit the places we feature, keep listings up to
            date, and publish stories and guides to help you plan a better trip — whether you are
            visiting for a weekend or staying for a season.
          </p>
          <h2>Part of a Greek travel network</h2>
          <p>
            {name} belongs to a family of destination guides covering some of the most loved
            corners of Greece:
          </p>
          <ul>
            {explore.map((item) => (
              <li key={item.url}>
                <a href={item.url} target="_blank" rel="noopener">
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
          <h2>Feature your business</h2>
          <p>
            Run a great place in {site.place.name}? We would love to hear about it.{' '}
            <Link href="/promote">Tell us about your business</Link> and our team will get back to
            you with the details.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/promote" className="btn-primary">
            Promote your business
          </Link>
          <Link href="/contact" className="btn-ghost">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  )
}
