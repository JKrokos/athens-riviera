import {
  ExternalIcon,
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TicketIcon,
  TikTokIcon,
  YouTubeIcon,
} from '../ui/Icons'
import type { Listing } from '../../payload-types'

const prettyUrl = (url: string): string =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

export function ContactPanel({ listing }: { listing: Listing }) {
  const { contact, socials } = listing

  const socialLinks = [
    { href: socials?.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: socials?.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: socials?.tiktok, label: 'TikTok', Icon: TikTokIcon },
    { href: socials?.youtube, label: 'YouTube', Icon: YouTubeIcon },
    { href: socials?.linkedin, label: 'LinkedIn', Icon: LinkedInIcon },
  ].filter((social): social is { href: string; label: string; Icon: typeof FacebookIcon } =>
    Boolean(social.href),
  )

  const rows = [
    contact?.address
      ? {
          key: 'address',
          icon: <MapPinIcon width={18} height={18} className="text-accent" />,
          content: (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${listing.name} ${contact.address}`,
              )}`}
              target="_blank"
              rel="noopener nofollow"
              className="hover:text-accent-strong"
            >
              {contact.address}
            </a>
          ),
        }
      : null,
    contact?.phone
      ? {
          key: 'phone',
          icon: <PhoneIcon width={18} height={18} className="text-accent" />,
          content: (
            <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="hover:text-accent-strong">
              {contact.phone}
            </a>
          ),
        }
      : null,
    contact?.email
      ? {
          key: 'email',
          icon: <MailIcon width={18} height={18} className="text-accent" />,
          content: (
            <a href={`mailto:${contact.email}`} className="break-all hover:text-accent-strong">
              {contact.email}
            </a>
          ),
        }
      : null,
    contact?.website
      ? {
          key: 'website',
          icon: <GlobeIcon width={18} height={18} className="text-accent" />,
          content: (
            <a
              href={contact.website}
              target="_blank"
              rel="noopener nofollow"
              className="break-all hover:text-accent-strong"
            >
              {prettyUrl(contact.website)}
            </a>
          ),
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null)

  if (rows.length === 0 && socialLinks.length === 0 && !contact?.bookingLink) return null

  return (
    <aside aria-label="Contact information" className="rounded-card border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Contact</h2>
      <ul className="mt-4 space-y-3.5 text-sm text-ink-soft">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{row.icon}</span>
            {row.content}
          </li>
        ))}
      </ul>

      {socialLinks.length > 0 ? (
        <div className="mt-5 flex gap-2">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener nofollow"
              aria-label={`${listing.name} on ${label}`}
              className="rounded-full border border-line p-2.5 text-ink-soft transition-colors hover:border-accent hover:text-accent-strong"
            >
              <Icon width={18} height={18} />
            </a>
          ))}
        </div>
      ) : null}

      {contact?.bookingLink ? (
        <a
          href={contact.bookingLink}
          target="_blank"
          rel="noopener nofollow"
          className="btn-primary mt-6 w-full"
        >
          <TicketIcon width={18} height={18} />
          Book now
          <ExternalIcon width={14} height={14} />
        </a>
      ) : null}
    </aside>
  )
}
