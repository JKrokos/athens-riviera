import Link from 'next/link'

import { ChevronLeftIcon, ChevronRightIcon } from './ui/Icons'

const pageHref = (base: string, page: number): string => (page <= 1 ? base : `${base}/page/${page}`)

export function Pagination({
  base,
  current,
  total,
}: {
  base: string
  current: number
  total: number
}) {
  if (total <= 1) return null

  const window = 2
  const pages = Array.from({ length: total }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === total || Math.abs(page - current) <= window,
  )

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {current > 1 ? (
        <Link
          href={pageHref(base, current - 1)}
          aria-label="Previous page"
          className="chip !px-2.5"
          rel="prev"
        >
          <ChevronLeftIcon width={16} height={16} />
        </Link>
      ) : null}
      {pages.map((page, index) => {
        const previous = pages[index - 1]
        const gap = previous !== undefined && page - previous > 1
        return (
          <span key={page} className="flex items-center gap-1.5">
            {gap ? <span className="px-1 text-muted">…</span> : null}
            {page === current ? (
              <span aria-current="page" className="chip !border-accent !bg-accent !text-white">
                {page}
              </span>
            ) : (
              <Link href={pageHref(base, page)} className="chip">
                {page}
              </Link>
            )}
          </span>
        )
      })}
      {current < total ? (
        <Link
          href={pageHref(base, current + 1)}
          aria-label="Next page"
          className="chip !px-2.5"
          rel="next"
        >
          <ChevronRightIcon width={16} height={16} />
        </Link>
      ) : null}
    </nav>
  )
}
