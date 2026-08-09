import Link from 'next/link'

import { ArrowRightIcon } from './Icons'

export function SectionHeading({
  kicker,
  title,
  link,
}: {
  kicker: string
  title: string
  link?: { label: string; href: string }
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="kicker mb-2">{kicker}</p>
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
      </div>
      {link ? (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-accent-strong hover:text-ink"
        >
          {link.label}
          <ArrowRightIcon
            width={18}
            height={18}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : null}
    </div>
  )
}
