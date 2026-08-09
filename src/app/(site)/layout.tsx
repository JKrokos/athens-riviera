import type { Metadata, Viewport } from 'next'

import { bodyFont, displayFont } from '../fonts'
import { Analytics, CookieConsent } from '../../components/CookieConsent'
import { Footer } from '../../components/layout/Footer'
import { Header } from '../../components/layout/Header'
import { JsonLd } from '../../components/seo/JsonLd'
import { getSettings } from '../../lib/data'
import { mediaUrl } from '../../lib/media'
import { organizationJsonLd, webSiteJsonLd } from '../../lib/seo'
import { site } from '../../site.config'

import '../../styles/globals.css'

// Pages are statically generated and refreshed hourly; content edits in the
// CMS additionally trigger an immediate on-demand revalidation.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const title = settings.seoTitle || `${site.name} — ${site.tagline}`
  const description = settings.seoDescription || site.description
  const ogImage = mediaUrl(settings.ogImage, 'hero')

  return {
    metadataBase: new URL(site.baseUrl),
    title: {
      default: title,
      template: `%s · ${settings.siteName || site.name}`,
    },
    description,
    openGraph: {
      siteName: settings.siteName || site.name,
      locale: site.locale,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: '/' },
  }
}

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: 'device-width',
  initialScale: 1,
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang={site.language} className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <JsonLd data={[organizationJsonLd(settings), webSiteJsonLd(settings)]} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CookieConsent />
        <Analytics gaId={settings.gaId} />
      </body>
    </html>
  )
}
