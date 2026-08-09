// ---------------------------------------------------------------------------
// Per-site configuration. This file (plus src/styles/theme.css, the logo
// assets and redirects.mjs) is the only thing that differs between the
// Athens network sites — everything else is shared code.
// ---------------------------------------------------------------------------

export const site = {
  key: 'athens-riviera',
  name: 'Athens Riviera',
  domain: 'athensriviera.eu',
  baseUrl: (process.env.NEXT_PUBLIC_SERVER_URL || 'https://athensriviera.eu').replace(/\/$/, ''),
  tagline: 'Discover the Athens Riviera',
  description:
    'Your insider guide to the Athens Riviera — the best seaside restaurants, hotels, beaches, yachting and shopping along the coast from Faliro to Sounio, curated by locals.',
  locale: 'en_US',
  language: 'en',
  themeColor: '#f5f9fd',

  // Used for LocalBusiness / Place structured data and local SEO
  place: {
    name: 'Athens Riviera',
    region: 'Attica',
    countryCode: 'GR',
    countryName: 'Greece',
    latitude: 37.8623,
    longitude: 23.755,
  },

  defaultContact: {
    email: 'info@athensriviera.eu',
    phone: '+30 6970079745',
  },

  // Sister sites shown in the Explore menu and footer
  network: [
    { name: 'Athens Best', url: 'https://athensbest.eu' },
    { name: 'Mykonos Best', url: 'https://mykonosbest.eu' },
    { name: 'Santorini Best', url: 'https://santorinibest.eu' },
    { name: 'Paros Best', url: 'https://parosbest.eu' },
    { name: 'Aegean Islands', url: 'https://aegeanislands.promo' },
  ],

  credit: { name: 'Webee.gr', url: 'https://webee.gr' },

  // Menu groups built by the importer from imported categories/areas.
  // Slugs reference canonical (post-merge) category slugs; groups and slugs
  // without listings are skipped automatically.
  navPlan: [
    {
      title: 'Stay',
      categorySlugs: ['hotels', 'villas-suites', 'villa-rentals', 'accommodation'],
    },
    {
      title: 'Eat & Drink',
      categorySlugs: [
        'restaurants',
        'on-the-beach-restaurants',
        'bar-restaurants',
        'cafe-bar-restaurants',
      ],
    },
    {
      title: 'Experiences',
      categorySlugs: ['yacht', 'yachting-services', 'limousine-tours', 'vip-services', '24-hours'],
    },
    {
      title: 'Shopping',
      categorySlugs: ['shopping', 'fashion', 'art-home-design', 'wedding-dresses', 'wines'],
    },
    {
      title: 'Services',
      categorySlugs: ['luxury-services', 'travel-agencies-partners', 'car-rentals'],
    },
  ],

  // Where the importer pulls the old WordPress content from
  legacy: {
    wpBaseUrl: 'https://athensriviera.eu',
    // Old post URLs look like /blog/YYYY/MM/DD/<slug>/ (redirected to /blog/<slug>)
    postPathPrefix: '/blog',
    // Slugs merged into a canonical slug during import (301s in redirects.mjs)
    categoryMerges: {
      accomondation: 'accommodation',
      'villas-and-suites': 'villas-suites',
      yachting: 'yacht',
      winery: 'wines',
    } as Record<string, string>,
    // Test/junk regions that must not be imported
    dropRegions: ['santorini'],
    // Regions from the old site that are really the same place
    regionMerges: {
      'athens-riviera': 'riviera',
    } as Record<string, string>,
  },
} as const

export type SiteConfig = typeof site
