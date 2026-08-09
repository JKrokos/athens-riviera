import type { CollectionConfig } from 'payload'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Contact Submission', plural: 'Contact Submissions' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'topic', 'createdAt'],
    group: 'Admin',
  },
  access: {
    // Created through the site's /api/contact endpoint
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    {
      name: 'topic',
      type: 'select',
      options: [
        { label: 'General enquiry', value: 'general' },
        { label: 'Promote my business', value: 'promote' },
      ],
      defaultValue: 'general',
    },
    { name: 'business', type: 'text', label: 'Business name' },
    { name: 'message', type: 'textarea', required: true },
  ],
}
