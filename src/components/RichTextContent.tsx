import Image from 'next/image'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { asMedia, mediaAlt, mediaUrl } from '../lib/media'
import type { ImageBlock } from '../payload-types'

const ALIGN_CLASSES: Record<string, string> = {
  left: 'float-left clear-left mb-4 mr-6 w-full sm:w-1/2 lg:w-[45%]',
  right: 'float-right clear-right mb-4 ml-6 w-full sm:w-1/2 lg:w-[45%]',
  center: 'clear-both mx-auto my-8 w-full max-w-3xl',
}

function AlignedImage({ image, align, caption }: ImageBlock) {
  const media = asMedia(image)
  const url = mediaUrl(media, 'card')
  if (!media || !url) return null
  return (
    <figure className={`not-prose ${ALIGN_CLASSES[align ?? 'center'] ?? ALIGN_CLASSES.center}`}>
      <Image
        src={url}
        alt={mediaAlt(media, caption ?? '')}
        width={media.sizes?.card?.width ?? media.width ?? 960}
        height={media.sizes?.card?.height ?? media.height ?? 640}
        sizes="(max-width: 640px) 100vw, 720px"
        className="h-auto w-full rounded-card"
      />
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

const converters: JSXConvertersFunction<DefaultNodeTypes | SerializedBlockNode<ImageBlock>> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  blocks: {
    imageBlock: ({ node }) => <AlignedImage {...node.fields} />,
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
