# Athens Riviera — athensriviera.eu

Next.js (App Router) site with [Payload CMS](https://payloadcms.com) built in —
one app, one deploy. The admin panel lives at `/admin`; the site queries the
database directly through Payload's Local API (no separate CMS server).

Fresh 2026 rebuild of the old WordPress/MyListing directory. Shares its
codebase design with athensbest.eu — the two sites differ only in
`src/site.config.ts`, `src/styles/theme.css`, `src/app/fonts.ts`,
`src/components/ui/BrandLogo.tsx`, `redirects.mjs` and the logo assets.

## Stack

| Piece     | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Framework | Next.js 16 App Router (RSC), static pages + hourly ISR     |
| CMS       | Payload 3 (embedded, admin at `/admin`)                    |
| Database  | PostgreSQL (Railway)                                       |
| Media     | Railway S3 bucket via `@payloadcms/storage-s3`             |
| Hosting   | Railway (single `web` service)                             |
| Styling   | Tailwind CSS + per-site design tokens (CSS variables)      |

## Content model

- **Categories** — flat slugs (`/category/<slug>`, matching the old WordPress
  URLs) with optional parent grouping, homepage placement flags.
- **Areas** — Athens neighbourhoods (`/region/<slug>`), used for filtering and
  area landing pages.
- **Listings** — the businesses (`/listing/<slug>`): gallery, rich-text
  description, contact details, socials, coordinates, featured flag.
- **Posts** — blog articles (`/blog/<slug>`), including Greek-language ones.
- **Site Settings** (global) — identity, hero, navigation, explore links,
  contact, SEO defaults, GA4 id, footer.

## SEO / GEO

Per-page `generateMetadata` with canonicals and OpenGraph, JSON-LD
(Organization, WebSite + SearchAction, LocalBusiness with geo per listing,
Article, BreadcrumbList, CollectionPage), `sitemap.xml`, `robots.txt` and
`llms.txt` — all generated from live content. Old WordPress URLs 301-redirect
via `redirects.mjs`; listing/category/region URLs are unchanged by design.

## Cookies / privacy

GDPR consent banner; Google Analytics 4 loads only after consent
(`Site Settings → SEO → GA4 id`). `/privacy-policy` documents everything.

## Local development

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL + PAYLOAD_SECRET
npm run migrate             # apply schema
npm run dev                 # site on :3000, admin on :3000/admin
```

Without `S3_*` variables uploads land in `./media` on disk.

## Deployment (Railway)

`railway.json` builds with migrations (`payload migrate`) before `next build`
and starts with `npm run railway:start`. Health check: `/api/health`.

## WordPress migration

`src/lib/importer.ts` migrates the old WordPress site: categories and regions
(scraped from taxonomy pages), listings (sitemap-driven page scraping —
LocalBusiness JSON-LD + DOM), posts with inline images (REST API), and all
media. Duplicate taxonomy slugs are merged (301s in `redirects.mjs`), test
regions dropped. Idempotent — re-runs update in place. It also seeds Site
Settings (navigation, homepage flags, featured content) after counting real
listings.

```bash
# start (runs in the background server-side); also runs automatically on
# first boot when IMPORT_ON_BOOT=true and the database is empty
curl -X POST "https://<host>/api/import?secret=$IMPORT_SECRET"
# watch progress
curl "https://<host>/api/import?secret=$IMPORT_SECRET"
```

## Content updates

Payload hooks call `revalidatePath` after every change, refreshing the static
pages immediately; pages also refresh hourly (ISR) as a safety net.
