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
import { imageBlock } from './lib/lexicalBlocks'
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
      BlocksFeature({ blocks: [imageBlock] }),
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

    // First-boot content migration: when IMPORT_ON_BOOT is set and the
    // database has no listings yet, pull everything from the old WordPress
    // site in the background. Progress goes to the deploy logs; the
    // /api/import endpoint can also trigger/monitor the same job.
    const importFlag = process.env.IMPORT_ON_BOOT
    if (importFlag === 'true' || importFlag === 'force') {
      const listings = await payload.count({ collection: 'listings' })
      if (listings.totalDocs === 0 || importFlag === 'force') {
        payload.logger.info('IMPORT_ON_BOOT: scheduling WordPress migration')
        setTimeout(async () => {
          try {
            const { runWordPressImport } = await import('./lib/importer')
            const summary = await runWordPressImport(payload, (message) =>
              payload.logger.info(`[wp-import] ${message}`),
            )
            payload.logger.info(`[wp-import] finished: ${JSON.stringify(summary)}`)
          } catch (error) {
            payload.logger.error(
              `[wp-import] failed: ${error instanceof Error ? error.message : error}`,
            )
          }
        }, 20_000)
      } else {
        payload.logger.info(
          `IMPORT_ON_BOOT set but ${listings.totalDocs} listings exist — skipping`,
        )
      }
    } else if (importFlag === 'media-refetch') {
      // Recover lost media binaries from the original WordPress URLs.
      // Pointless without durable storage — the files would be lost again.
      if (!s3Enabled) {
        payload.logger.error('IMPORT_ON_BOOT=media-refetch ignored: S3 storage is not configured')
      } else {
        payload.logger.info('IMPORT_ON_BOOT=media-refetch: scheduling media recovery')
        setTimeout(async () => {
          try {
            const { refetchMedia } = await import('./lib/importer')
            await refetchMedia(payload, (message) => payload.logger.info(`[wp-import] ${message}`))
          } catch (error) {
            payload.logger.error(
              `[wp-import] media refetch failed: ${error instanceof Error ? error.message : error}`,
            )
          }
        }, 20_000)
      }
    } else if (importFlag === 'taxonomy-images') {
      // Content is already imported — only fill in category/area cover images
      payload.logger.info('IMPORT_ON_BOOT=taxonomy-images: scheduling cover assignment')
      setTimeout(async () => {
        try {
          const { assignTaxonomyImages } = await import('./lib/importer')
          await assignTaxonomyImages(payload, (message) =>
            payload.logger.info(`[wp-import] ${message}`),
          )
        } catch (error) {
          payload.logger.error(
            `[wp-import] taxonomy images failed: ${error instanceof Error ? error.message : error}`,
          )
        }
      }, 20_000)
    }
  },
})
