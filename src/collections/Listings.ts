import type { CollectionConfig } from 'payload'

import { previewUrl } from '../lib/postHooks'
import { formatSlugHook } from '../lib/slug'
import { revalidateSite } from '../lib/revalidate'
import { validateOptionalUrl } from '../lib/validate'

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'primaryCategory', 'area', 'featured', 'published'],
    group: 'Content',
    preview: (doc) => previewUrl(doc, (slug) => `/listing/${slug}`),
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
        description: 'URL: /listing/<slug>. Generated from the name when left empty.',
      },
      hooks: { beforeValidate: [formatSlugHook('name')] },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'primaryCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: { description: 'Used for breadcrumbs and related listings.' },
    },
    { name: 'area', type: 'relationship', relationTo: 'areas' },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: { description: 'Short summary for cards and meta descriptions.' },
    },
    { name: 'description', type: 'richText' },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'First image is the cover.' },
    },
    {
      type: 'group',
      name: 'contact',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'phone', type: 'text' },
            { name: 'email', type: 'text' },
          ],
        },
        { name: 'address', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'website', type: 'text', validate: validateOptionalUrl },
            { name: 'bookingLink', type: 'text', label: 'Booking link', validate: validateOptionalUrl },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'socials',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'facebook', type: 'text', validate: validateOptionalUrl },
            { name: 'instagram', type: 'text', validate: validateOptionalUrl },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'youtube', type: 'text', validate: validateOptionalUrl },
            { name: 'linkedin', type: 'text', validate: validateOptionalUrl },
            { name: 'tiktok', type: 'text', validate: validateOptionalUrl },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'location',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'latitude', type: 'text' },
            { name: 'longitude', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show in the homepage featured section.',
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
