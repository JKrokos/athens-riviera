import type { Block } from 'payload'

// Aligned image for rich text. The stock upload node cannot be aligned
// (AlignFeature only aligns paragraphs), so editors insert this block when
// they need an image floated left/right or centred. Existing upload nodes in
// imported posts keep working unchanged.
export const imageBlock: Block = {
  slug: 'imageBlock',
  interfaceName: 'ImageBlock',
  labels: { singular: 'Aligned image', plural: 'Aligned images' },
  admin: {
    components: {
      Label: '/components/admin/ImageBlockLabel#ImageBlockLabel',
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
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}
