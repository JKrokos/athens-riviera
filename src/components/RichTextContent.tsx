import Image from 'next/image'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { asMedia, mediaAlt, mediaUrl } from '../lib/media'
import type { HtmlBlock, ImageBlock } from '../payload-types'

// Floats are only meaningful below full width; full width always centres
const layoutClass = (align: string, size: string): string => {
  if (size === 'full') return 'clear-both my-8 w-full'
  const width = size === 'small' ? 'w-full sm:w-1/3' : 'w-full sm:w-1/2'
  if (align === 'left') return `float-left clear-left mb-4 mr-6 ${width}`
  if (align === 'right') return `float-right clear-right mb-4 ml-6 ${width}`
  return `clear-both mx-auto my-8 ${width}`
}

function AlignedImage({ image, align, size, caption }: ImageBlock) {
  const media = asMedia(image)
  const url = mediaUrl(media, 'card')
  if (!media || !url) return null
  const sizeValue = size ?? 'medium'
  return (
    <figure className={`not-prose ${layoutClass(align ?? 'center', sizeValue)}`}>
      <Image
        src={url}
        alt={mediaAlt(media, caption ?? '')}
        width={media.sizes?.card?.width ?? media.width ?? 960}
        height={media.sizes?.card?.height ?? media.height ?? 640}
        sizes={sizeValue === 'full' ? '100vw' : sizeValue === 'small' ? '33vw' : '50vw'}
        className="h-auto w-full rounded-card"
      />
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

// The default converters stay in place, so classic upload nodes in imported
// content keep rendering unchanged.
const converters: JSXConvertersFunction<
  DefaultNodeTypes | SerializedBlockNode<ImageBlock> | SerializedBlockNode<HtmlBlock>
> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    imageBlock: ({ node }) => <AlignedImage {...(node.fields as ImageBlock)} />,
    htmlBlock: ({ node }) => {
      const html = (node.fields as HtmlBlock).html
      return html ? <div className="rt-html" dangerouslySetInnerHTML={{ __html: html }} /> : null
    },
  },
})

export function RichTextContent({
  data,
  className,
}: {
  data: unknown
  className?: string
}) {
  if (!data || typeof data !== 'object') return null
  return (
    <div className={className ?? 'prose-site'}>
      <RichText data={data as SerializedEditorState} converters={converters} />
    </div>
  )
}
