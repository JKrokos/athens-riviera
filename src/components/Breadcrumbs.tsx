import Link from 'next/link'
import { Fragment } from 'react'

import { breadcrumbJsonLd } from '../lib/seo'
import { ChevronRightIcon } from './ui/Icons'
import { JsonLd } from './seo/JsonLd'

export type Crumb = { name: string; path?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: 'Home', path: '/' }, ...items]

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          {all.map((item, index) => (
            <Fragment key={`${item.name}-${index}`}>
              {index > 0 ? <ChevronRightIcon width={14} height={14} className="shrink-0" /> : null}
              <li>
                {item.path && index < all.length - 1 ? (
                  <Link href={item.path} className="hover:text-accent-strong">
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-ink-soft">
                    {item.name}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    </>
  )
}
