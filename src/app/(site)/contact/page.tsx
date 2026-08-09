import type { Metadata } from 'next'

import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { ContactForm } from '../../../components/ContactForm'
import { MailIcon, MapPinIcon, PhoneIcon } from '../../../components/ui/Icons'
import { getSettings } from '../../../lib/data'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: 'Contact us',
  description: `Get in touch with the ${site.name} team — questions, corrections, partnerships or anything else.`,
  path: '/contact',
})

export default async function ContactPage() {
  const settings = await getSettings()
  const email = settings.contactEmail || site.defaultContact.email
  const phone = settings.contactPhone || site.defaultContact.phone

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ name: 'Contact' }]} />
        <p className="kicker">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">Get in touch</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Questions, corrections, ideas or partnerships — drop us a line and we’ll get back to you.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-ink-soft">
          <li className="flex items-center gap-3">
            <PhoneIcon width={18} height={18} className="text-accent" />
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-accent-strong">
              {phone}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <MailIcon width={18} height={18} className="text-accent" />
            <a href={`mailto:${email}`} className="hover:text-accent-strong">
              {email}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <MapPinIcon width={18} height={18} className="text-accent" />
            {settings.address || `${site.place.name}, ${site.place.countryName}`}
          </li>
        </ul>

        <div className="mt-10 rounded-card border border-line bg-surface p-6 sm:p-8">
          <ContactForm topic="general" />
        </div>
      </div>
    </div>
  )
}
