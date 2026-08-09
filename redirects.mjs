// 301 redirects from the old WordPress athensriviera.eu URL structure.
// Listing (/listing/<slug>), category (/category/<slug>) and region
// (/region/<slug>) URLs are unchanged by design, so only moved or merged
// paths appear here. This file is per-site.

const permanent = true

export const redirects = [
  // Blog posts lived under date permalinks: /blog/YYYY/MM/DD/<slug>
  {
    source: '/blog/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug',
    destination: '/blog/:slug',
    permanent,
  },
  { source: '/blog/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})', destination: '/blog', permanent },

  // Category slugs merged during import (typos/duplicates on the old site)
  { source: '/category/accomondation', destination: '/category/accommodation', permanent },
  { source: '/category/villas-and-suites', destination: '/category/villas-suites', permanent },
  { source: '/category/yachting', destination: '/category/yacht', permanent },
  { source: '/category/winery', destination: '/category/wines', permanent },

  // Region slugs merged during import
  { source: '/region/athens-riviera', destination: '/region/riviera', permanent },

  // Old WordPress utility pages
  { source: '/about-us', destination: '/about', permanent },
  { source: '/team', destination: '/about', permanent },
  { source: '/our-team', destination: '/about', permanent },
  { source: '/contact-us', destination: '/contact', permanent },
  { source: '/my-account', destination: '/promote', permanent },
  { source: '/my-account/:path*', destination: '/promote', permanent },
  { source: '/shop', destination: '/promote', permanent },
  { source: '/shop/:path*', destination: '/promote', permanent },
  { source: '/product/:path*', destination: '/promote', permanent },
  { source: '/cart', destination: '/promote', permanent },
  { source: '/checkout', destination: '/promote', permanent },
  { source: '/explore-athens-riviera', destination: '/explore', permanent },
  { source: '/privacy-center/:path*', destination: '/privacy-policy', permanent },
  { source: '/cookie-policy', destination: '/privacy-policy', permanent },
]
