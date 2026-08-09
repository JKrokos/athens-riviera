import type { CollectionConfig } from 'payload'

import { formatSlugHook } from '../lib/slug'
import { revalidateSite } from '../lib/revalidate'

export const Areas: CollectionConfig = {
  slug: 'areas',
  labels: { singular: 'Area', plural: 'Areas' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'featured'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [() => revalidateSite()],
    afterDelete: [() => revalidateSite()],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL: /region/<slug>. Generated from the name when left empty.',
      },
      hooks: { beforeValidate: [formatSlugHook('name')] },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Shown on the area page and used as its meta description.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Show in the homepage "Best places" section.' },
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Lower numbers appear first.' },
        },
      ],
    },
  ],
}
