import type { Block } from 'payload'

// Aligned image inside rich text. Payload's AlignFeature only aligns
// paragraphs, so upload nodes can't float — this block carries its own
// alignment and width, which the frontend serializer and the admin preview
// honour. Existing upload nodes in imported posts keep working unchanged.
// Same schema as the other network sites so editors get one workflow.
export const imageBlock: Block = {
  slug: 'imageBlock',
  interfaceName: 'ImageBlock',
  labels: { singular: 'Image', plural: 'Images' },
  admin: {
    components: {
      Block: '/components/admin/ImageBlock#ImageBlockComponent',
    },
  },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'align',
          type: 'select',
          defaultValue: 'center',
          required: true,
          options: [
            { label: 'Left (text wraps right)', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right (text wraps left)', value: 'right' },
          ],
        },
        {
          name: 'size',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'Small (33%)', value: 'small' },
            { label: 'Medium (50%)', value: 'medium' },
            { label: 'Full width', value: 'full' },
          ],
          admin: { description: 'Full width ignores left/right alignment' },
        },
      ],
    },
    { name: 'caption', type: 'text' },
  ],
}

// Raw HTML source inside rich text — embeds, tables, or markup the editor
// can't express. Rendered verbatim on the frontend.
export const htmlBlock: Block = {
  slug: 'htmlBlock',
  interfaceName: 'HtmlBlock',
  labels: { singular: 'HTML source', plural: 'HTML sources' },
  fields: [
    {
      name: 'html',
      type: 'code',
      required: true,
      admin: {
        language: 'html',
        description: 'Rendered exactly as written — only paste HTML you trust.',
      },
    },
  ],
}
