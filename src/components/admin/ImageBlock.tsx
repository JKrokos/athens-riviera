'use client'

import React, { useEffect, useState } from 'react'

type BlockProps = {
  formData?: {
    image?: number | { id?: number; url?: string; sizes?: { thumb?: { url?: string } } }
    align?: string
    size?: string
    caption?: string
  }
  isEditor?: boolean
  blockContext?: { BlockCollapsible?: React.ComponentType<{ children: React.ReactNode }> }
}

// Admin-side rendering of the aligned image block: shows the chosen image
// where it will sit (left / center / right, at the chosen width) instead of
// a bare form. Editing still happens in the block drawer.
export const ImageBlockComponent: React.FC<BlockProps> = (props) => {
  const { formData } = props
  const align = formData?.align || 'center'
  const size = formData?.size || 'medium'
  const caption = formData?.caption || ''
  const image = formData?.image
  const imageId = typeof image === 'object' && image ? image.id : image

  const [thumb, setThumb] = useState<string | null>(
    typeof image === 'object' && image?.sizes?.thumb?.url
      ? image.sizes.thumb.url
      : typeof image === 'object' && image?.url
        ? image.url
        : null,
  )

  useEffect(() => {
    if (!imageId || (typeof image === 'object' && image?.url)) return
    let cancelled = false
    fetch(`/payload-api/media/${imageId}?depth=0`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((doc) => {
        if (!cancelled && doc) setThumb(doc.sizes?.thumb?.url || doc.url || null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [imageId, image])

  const preview = (
    <div
      style={{
        display: 'flex',
        justifyContent:
          size === 'full'
            ? 'center'
            : align === 'left'
              ? 'flex-start'
              : align === 'right'
                ? 'flex-end'
                : 'center',
        padding: '8px 0',
      }}
    >
      <figure
        style={{
          margin: 0,
          width: size === 'full' ? '100%' : size === 'small' ? '33%' : '50%',
          textAlign: 'center',
        }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            style={{ width: '100%', height: 'auto', borderRadius: 4, display: 'block' }}
          />
        ) : (
          <div
            style={{
              border: '1px dashed var(--theme-elevation-300)',
              borderRadius: 4,
              padding: '24px 8px',
              color: 'var(--theme-elevation-600)',
              fontSize: 12,
            }}
          >
            {imageId ? 'Loading image…' : 'No image selected'}
          </div>
        )}
        <figcaption style={{ fontSize: 12, color: 'var(--theme-elevation-600)', marginTop: 6 }}>
          {caption || `Image · ${align} · ${size}`}
        </figcaption>
      </figure>
    </div>
  )

  if (props.isEditor && props.blockContext?.BlockCollapsible) {
    const { BlockCollapsible } = props.blockContext
    return <BlockCollapsible>{preview}</BlockCollapsible>
  }
  return preview
}
