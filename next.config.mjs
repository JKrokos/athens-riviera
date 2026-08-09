import { withPayload } from '@payloadcms/next/withPayload'

import { redirects } from './redirects.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return redirects
  },

  images: {
    remotePatterns: [
      // Old WordPress uploads are referenced only until media is migrated.
      // Both legacy sites host media on athensbest.eu.
      { protocol: 'https', hostname: 'athensbest.eu' },
      { protocol: 'https', hostname: 'athensriviera.eu' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default withPayload(nextConfig)
