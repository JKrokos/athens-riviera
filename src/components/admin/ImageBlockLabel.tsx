'use client'

import { useFormFields } from '@payloadcms/ui'

const LABELS: Record<string, string> = {
  left: '◧ Image · left, text wraps right',
  center: '▣ Image · centred',
  right: '◨ Image · right, text wraps left',
}

// Block label inside the Lexical editor: shows the chosen alignment so the
// document outline reflects the layout without opening the block
export function ImageBlockLabel() {
  const align = useFormFields(([fields]) => {
    const key = Object.keys(fields ?? {}).find((name) => name === 'align' || name.endsWith('.align'))
    return key ? (fields[key]?.value as string | undefined) : undefined
  })
  return <span>{LABELS[align ?? 'center'] ?? 'Aligned image'}</span>
}
