import Image from 'next/image'
import Link from 'next/link'

import { getHomepageCategories, getSettings } from '../../lib/data'
import { mediaUrl } from '../../lib/media'
import { site } from '../../site.config'
import { BrandLogo } from '../ui/BrandLogo'
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TikTokIcon,
  YouTubeIcon,
} from '../ui/Icons'
import { CookieSettingsButton } from '../CookieConsent'

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getHomepageCategories()])
  const year = new Date().getFullYear()
  const name = settings.siteName || site.name
  const explore =
    settings.exploreLinks && settings.exploreLinks.length > 0
      ? settings.exploreLinks.map((link) => ({ name: link.name, url: link.url }))
      : site.network

  const socials = [
    { href: settings.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: settings.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.tiktok, label: 'TikTok', Icon: TikTokIcon },
    { href: settings.youtube, label: 'YouTube', Icon: YouTubeIcon },
  ].filter((social): social is { href: string; label: string; Icon: typeof FacebookIcon } =>
    Boolean(social.href),
  )

  const partnerLogos = settings.partnerLogos ?? []

  return (
    <footer className="mt-20 bg-footer-bg text-white/80">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo onDark />
          <p className="mt-3 text-sm leading-relaxed">
            {settings.footerAbout ||
              `${name} is your local guide to ${site.place.name} — the best places to stay, eat, shop and explore, curated by people who live here.`}
          </p>
          {socials.length > 0 ? (
            <div className="mt-4 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener"
                  aria-label={label}
                  className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-accent hover:text-white"
                >
                  <Icon width={18} height={18} />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <nav aria-label="Discover">
          <p className="kicker mb-3">Discover</p>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 7).map((category) => (
              <li key={category.id}>
                <Link href={`/category/${category.slug}`} className="hover:text-accent">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/explore" className="font-semibold text-white hover:text-accent">
                All categories →
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Explore Greece">
          <p className="kicker mb-3">Explore Greece</p>
          <ul className="space-y-2 text-sm">
            {explore.map((item) => (
              <li key={item.url}>
                <a href={item.url} target="_blank" rel="noopener" className="hover:text-accent">
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="kicker mb-3">Contact</p>
          <ul className="space-y-2.5 text-sm">
            {settings.contactPhone ? (
              <li>
                <a
                  href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2.5 hover:text-accent"
                >
                  <PhoneIcon width={16} height={16} className="text-accent" />
                  {settings.contactPhone}
                </a>
              </li>
            ) : null}
            {settings.contactEmail ? (
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-center gap-2.5 hover:text-accent"
                >
                  <MailIcon width={16} height={16} className="text-accent" />
                  {settings.contactEmail}
                </a>
              </li>
            ) : null}
            <li className="flex items-center gap-2.5">
              <MapPinIcon width={16} height={16} className="text-accent" />
              {settings.address || `${site.place.name}, ${site.place.countryName}`}
            </li>
          </ul>
          <Link href="/promote" className="btn-primary mt-5">
            Promote your business
          </Link>
        </div>
      </div>

      {partnerLogos.length > 0 ? (
        <div className="border-t border-white/10">
          <div className="container-site flex flex-wrap items-center justify-center gap-8 py-6">
            {partnerLogos.map((partner) => {
              const logoUrl = mediaUrl(partner.logo, 'thumb')
              if (!logoUrl) return null
              const image = (
                <Image
                  src={logoUrl}
                  alt={partner.name}
                  width={110}
                  height={40}
                  className="h-9 w-auto opacity-70 transition-opacity hover:opacity-100"
                />
              )
              return partner.url ? (
                <a key={partner.id} href={partner.url} target="_blank" rel="noopener">
                  {image}
                </a>
              ) : (
                <span key={partner.id}>{image}</span>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/60 sm:flex-row">
          <p>
            © {year} {site.domain} — All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-accent">
              Privacy &amp; Cookie Policy
            </Link>
            <CookieSettingsButton className="hover:text-accent" />
            <Link href="/contact" className="hover:text-accent">
              Contact
            </Link>
            <span>
              Made by{' '}
              <a
                href={site.credit.url}
                target="_blank"
                rel="noopener"
                className="underline decoration-white/30 underline-offset-2 hover:text-accent"
              >
                {site.credit.name}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
