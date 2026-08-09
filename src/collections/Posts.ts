import type { CollectionConfig } from 'payload'

import { formatSlugHook } from '../lib/slug'
import { revalidateSite } from '../lib/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'language'],
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
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL: /blog/<slug>. Generated from the title when left empty.',
      },
      hooks: { beforeValidate: [formatSlugHook('title')] },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: { description: 'Short summary for cards and meta descriptions.' },
    },
    { name: 'content', type: 'richText' },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'language',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Greek', value: 'el' },
      ],
      defaultValue: 'en',
      admin: { position: 'sidebar' },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
