import type { Metadata } from 'next'

import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { ContactForm } from '../../../components/ContactForm'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: 'Promote your business',
  description: `Get your business featured on ${site.name} — reach travellers and locals looking for the best places in ${site.place.name}.`,
  path: '/promote',
})

const benefits = [
  {
    title: 'A rich business profile',
    text: 'Photo gallery, description, contact details, website and booking links, social media and map location — everything in one page.',
  },
  {
    title: 'Found by the right people',
    text: `Visitors come to ${site.name} specifically to decide where to stay, eat and shop in ${site.place.name}.`,
  },
  {
    title: 'Featured placement',
    text: 'Featured businesses appear on the homepage and at the top of their category.',
  },
]

export default function PromotePage() {
  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ name: 'Promote your business' }]} />
        <p className="kicker">For business owners</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">
          Get featured on {site.name}
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Tell us about your business and our team will come back to you with the options and
          pricing.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-card border border-line bg-surface p-5">
              <h2 className="font-display text-lg font-semibold text-ink">{benefit.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{benefit.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-card border border-line bg-surface p-6 sm:p-8">
          <ContactForm topic="promote" />
        </div>
      </div>
    </div>
  )
}
