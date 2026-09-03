import type { CollectionConfig } from 'payload'

import {
  applyHtmlSource,
  clearOnDuplicate,
  copyTitleOnDuplicate,
  fillExcerpt,
  fillPublishedAt,
  previewUrl,
  regenerateOnDuplicate,
} from '../lib/postHooks'
import { formatSlugHook } from '../lib/slug'
import { revalidateSite } from '../lib/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'language'],
    group: 'Content',
    preview: (doc) => previewUrl(doc, (slug) => `/blog/${slug}`),
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    // Order matters: pasted HTML becomes content before the excerpt is derived
    beforeChange: [applyHtmlSource, fillExcerpt, fillPublishedAt],
    afterChange: [() => revalidateSite()],
    afterDelete: [() => revalidateSite()],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      hooks: { beforeDuplicate: [copyTitleOnDuplicate] },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL: /blog/<slug>. Generated from the title when left empty.',
      },
      hooks: {
        beforeValidate: [formatSlugHook('title')],
        // Regenerated from the new '(Copy)' title so the copy gets its own slug
        beforeDuplicate: [regenerateOnDuplicate],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description:
          'Short summary for cards and meta descriptions. Filled from the first paragraph when left empty.',
      },
    },
    { name: 'content', type: 'richText' },
    {
      // Virtual: never stored — converted into `content` on save
      name: 'contentHtml',
      type: 'code',
      virtual: true,
      label: 'HTML source',
      admin: {
        language: 'html',
        description:
          'Paste HTML here to replace the content above when you save. The box empties itself afterwards.',
      },
    },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'area',
      type: 'relationship',
      relationTo: 'areas',
      admin: { position: 'sidebar', description: 'Shows the story in the guides of that area.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
      defaultValue: () => new Date().toISOString(),
      hooks: { beforeDuplicate: [clearOnDuplicate] },
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
