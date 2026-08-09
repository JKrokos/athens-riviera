import type { MetadataRoute } from 'next'

import { absoluteUrl } from '../lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/payload-api/', '/api/', '/search'],
      },
      // Image crawlers may fetch media files served through the Payload API
      {
        userAgent: 'Googlebot-Image',
        allow: ['/payload-api/media/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
