import type { CollectionConfig } from 'payload'

const webp = { format: 'webp', options: { quality: 82 } } as const

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    description:
      'Upload photos at any size — originals are capped at 2560px on the long edge and card/hero sizes are generated automatically. Orientation from phone photos is preserved.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    mimeTypes: ['image/*'],
    // Originals are stored at most 2560px on the long edge (never enlarged);
    // Payload auto-rotates from EXIF before resizing
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumb', width: 480, formatOptions: webp },
      { name: 'card', width: 960, formatOptions: webp },
      { name: 'hero', width: 1920, formatOptions: webp },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    { name: 'alt', type: 'text' },
    {
      // Original WordPress URL — lets the importer skip files it already
      // downloaded when it re-runs
      name: 'sourceUrl',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
