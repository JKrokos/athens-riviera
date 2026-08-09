import type { GlobalConfig } from 'payload'

import { revalidateSite } from '../lib/revalidate'
import { site } from '../site.config'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [() => revalidateSite()],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'siteName', type: 'text', defaultValue: site.name },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: site.tagline,
            },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            {
              name: 'heroTitle',
              type: 'text',
              defaultValue: site.tagline,
            },
            {
              name: 'heroSubtitle',
              type: 'text',
              defaultValue: "Let's uncover the best places to eat, drink & shop.",
            },
          ],
        },
        {
          label: 'Navigation',
          fields: [
            {
              name: 'navGroups',
              label: 'Menu groups',
              type: 'array',
              admin: {
                description:
                  'Top-level menu entries. A group with one link renders as a plain link; more become a dropdown.',
              },
              fields: [
                { name: 'title', type: 'text', required: true },
                {
                  name: 'links',
                  type: 'array',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    {
                      name: 'category',
                      type: 'relationship',
                      relationTo: 'categories',
                      admin: { description: 'Link to a category page, or…' },
                    },
                    {
                      name: 'area',
                      type: 'relationship',
                      relationTo: 'areas',
                      admin: { description: '…to an area page, or…' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      admin: { description: '…a custom URL (internal or external).' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'exploreLinks',
              label: 'Explore network (sister sites)',
              type: 'array',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Contact & Social',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'contactEmail', type: 'text' },
                { name: 'contactPhone', type: 'text' },
              ],
            },
            {
              name: 'address',
              type: 'text',
              defaultValue: `${site.place.name}, ${site.place.countryName}`,
            },
            {
              type: 'row',
              fields: [
                { name: 'facebook', type: 'text' },
                { name: 'instagram', type: 'text' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'tiktok', type: 'text' },
                { name: 'youtube', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Blog',
          fields: [
            {
              name: 'featuredPost',
              type: 'relationship',
              relationTo: 'posts',
              admin: { description: 'Highlighted on the homepage. Falls back to the newest post.' },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              admin: { description: 'Default <title>. Page titles are appended as "Page · Title".' },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              admin: { description: 'Default meta description.' },
            },
            { name: 'ogImage', type: 'upload', relationTo: 'media' },
            {
              name: 'gaId',
              type: 'text',
              label: 'Google Analytics 4 ID',
              admin: {
                description: 'e.g. G-XXXXXXXXXX. Loaded only after cookie consent.',
              },
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerAbout',
              type: 'textarea',
              admin: { description: 'Short blurb shown in the footer.' },
            },
            {
              name: 'partnerLogos',
              type: 'array',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'logo', type: 'upload', relationTo: 'media', required: true },
                { name: 'url', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
