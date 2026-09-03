import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Areas } from './collections/Areas'
import { Listings } from './collections/Listings'
import { Posts } from './collections/Posts'
import { ContactSubmissions } from './collections/ContactSubmissions'
import { SiteSettings } from './globals/SiteSettings'
import { htmlBlock, imageBlock } from './lib/lexicalBlocks'
import { site } from './site.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Railway's private network is runtime-only, so `next build` (static page
// generation) must connect over the public URL while the running app uses
// the faster private one.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const connectionString = isBuildPhase
  ? process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL

const s3Enabled = Boolean(process.env.S3_BUCKET)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  routes: {
    // Payload REST lives under /payload-api so the site's own endpoints in
    // app/api/* can never collide with Payload's catch-all route
    api: '/payload-api',
  },
  admin: {
    user: 'users',
    meta: {
      titleSuffix: ` · ${site.name} CMS`,
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({ blocks: [imageBlock, htmlBlock] }),
    ],
  }),
  collections: [Users, Media, Categories, Areas, Listings, Posts, ContactSubmissions],
  globals: [SiteSettings],
  db: postgresAdapter({
    // Builds run several page-generation workers, each with its own pool,
    // while the previous deployment is still serving — keep pools small so
    // the combined total stays well under Postgres' connection limit
    pool: { connectionString, max: isBuildPhase ? 4 : 10 },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: s3Enabled,
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT || undefined,
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        // Railway buckets use virtual-hosted URLs; older buckets may need path style
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    // Make the storage backend visible in the deploy logs: media written to
    // the container disk disappears on the next deploy
    if (s3Enabled) {
      payload.logger.info(
        `[storage] media in S3 bucket "${process.env.S3_BUCKET}" via ${process.env.S3_ENDPOINT || 'default endpoint'}`,
      )
    } else if (process.env.NODE_ENV === 'production') {
      payload.logger.warn(
        '[storage] S3 is not configured — media is stored on the container disk and will be LOST on redeploy',
      )
    }

    // Create the first admin user on a fresh database so /admin is never
    // left open to whoever visits it first
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    if (adminEmail && adminPassword) {
      const existing = await payload.find({ collection: 'users', limit: 1, depth: 0 })
      if (existing.totalDocs === 0) {
        await payload.create({
          collection: 'users',
          data: { email: adminEmail, password: adminPassword, name: 'Admin' },
        })
        payload.logger.info(`Created initial admin user ${adminEmail}`)
      }
    }

    // Content jobs that run once after boot, selected with IMPORT_ON_BOOT
    // (comma-separated, run in order):
    //   true | force        full WordPress migration (force: even with content)
    //   media-refetch       re-download media binaries from their source URLs
    //   taxonomy-images     fill missing category/area covers from listings
    //   taxonomy-images-refresh  re-pick every cover and the homepage hero
    // Progress goes to the deploy logs; /api/import can also trigger a job.
    const modes = (process.env.IMPORT_ON_BOOT || '')
      .split(',')
      .map((mode) => mode.trim())
      .filter((mode) => mode && mode !== 'false')
    if (modes.length === 0) return

    const log = (message: string) => payload.logger.info(`[import] ${message}`)
    const runMode = async (mode: string): Promise<void> => {
      const importer = await import('./lib/importer')
      if (mode === 'true' || mode === 'force') {
        const listings = await payload.count({ collection: 'listings' })
        if (listings.totalDocs > 0 && mode !== 'force') {
          log(`full import skipped: ${listings.totalDocs} listings exist`)
          return
        }
        const summary = await importer.runWordPressImport(payload, log)
        log(`full import finished: ${JSON.stringify(summary)}`)
      } else if (mode === 'media-refetch') {
        if (!s3Enabled) {
          payload.logger.error('media-refetch ignored: S3 storage is not configured')
          return
        }
        await importer.refetchMedia(payload, log)
      } else if (mode === 'taxonomy-images' || mode === 'taxonomy-images-refresh') {
        const refresh = mode === 'taxonomy-images-refresh'
        await importer.assignTaxonomyImages(payload, log, { refresh })
        if (refresh) await importer.refreshHomepageHero(payload, log)
      } else {
        payload.logger.error(`unknown IMPORT_ON_BOOT mode "${mode}"`)
      }
    }

    payload.logger.info(`IMPORT_ON_BOOT: scheduling ${modes.join(', ')}`)
    setTimeout(async () => {
      for (const mode of modes) {
        try {
          log(`— ${mode} —`)
          await runMode(mode)
        } catch (error) {
          payload.logger.error(
            `[import] ${mode} failed: ${error instanceof Error ? error.message : error}`,
          )
        }
      }
      log('all boot jobs finished')
    }, 20_000)
  },
})
