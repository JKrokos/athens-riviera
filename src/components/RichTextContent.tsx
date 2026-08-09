import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

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
      <RichText data={data as SerializedEditorState} />
    </div>
  )
}
