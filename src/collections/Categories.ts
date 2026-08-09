import type { CollectionConfig } from 'payload'

import { formatSlugHook } from '../lib/slug'
import { revalidateSite } from '../lib/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent', 'showOnHomepage'],
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
        description: 'URL: /category/<slug>. Generated from the name when left empty.',
      },
      hooks: { beforeValidate: [formatSlugHook('name')] },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Shown on the category page and used as its meta description.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Optional parent for grouping related categories.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'showOnHomepage',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Show in the homepage category grid.' },
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
