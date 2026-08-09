import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 960 },
      { name: 'hero', width: 1920 },
    ],
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
