'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../ui/Icons'

export type GalleryImage = { url: string; largeUrl: string; alt: string }

export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      )
    },
    [images.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIndex, close, step])

  if (images.length === 0) return null

  const [cover, ...rest] = images
  const thumbs = rest.slice(0, 4)
  const extra = rest.length - thumbs.length

  return (
    <>
      <div className={`grid gap-2 ${thumbs.length > 0 ? 'lg:grid-cols-[2fr_1fr]' : ''}`}>
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="group relative aspect-[16/10] w-full overflow-hidden rounded-card"
          aria-label={`Open photo gallery for ${name}`}
        >
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {images.length > 1 ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {images.length} photos
            </span>
          ) : null}
        </button>
        {thumbs.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
            {thumbs.map((image, index) => (
              <button
                key={image.url + index}
                type="button"
                onClick={() => setOpenIndex(index + 1)}
                className="group relative aspect-square overflow-hidden rounded-xl lg:aspect-[4/3]"
                aria-label={`Open photo ${index + 2} of ${name}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {extra > 0 && index === thumbs.length - 1 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-bold text-white">
                    +{extra}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo gallery`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close gallery"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
          >
            <CloseIcon />
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                aria-label="Previous photo"
                className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                aria-label="Next photo"
                className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronRightIcon />
              </button>
            </>
          ) : null}
          <figure
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[openIndex].largeUrl}
              alt={images[openIndex].alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <figcaption className="absolute inset-x-0 -bottom-1 translate-y-full pt-3 text-center text-sm text-white/70">
              {openIndex + 1} / {images.length}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  )
}
