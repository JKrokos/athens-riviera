'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { BrandLogo } from '../ui/BrandLogo'
import {
  ChevronDownIcon,
  CloseIcon,
  ExternalIcon,
  MenuIcon,
  SearchIcon,
} from '../ui/Icons'

export type NavLink = { label: string; href: string }
export type NavGroup = { title: string; links: NavLink[] }

const isExternal = (href: string) => href.startsWith('http')

function DesktopItem({ group }: { group: NavGroup }) {
  if (group.links.length <= 1) {
    const href = group.links[0]?.href ?? '/'
    return (
      <Link
        href={href}
        className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
      >
        {group.title}
      </Link>
    )
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
      >
        {group.title}
        <ChevronDownIcon width={15} height={15} className="transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="min-w-[220px] rounded-2xl border border-line bg-surface p-2 shadow-card-hover">
          {group.links.map((link) =>
            isExternal(link.href) ? (
              <a
                key={link.href + link.label}
                href={link.href}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft hover:bg-accent-soft hover:text-ink"
              >
                {link.label}
                <ExternalIcon width={14} height={14} className="text-muted" />
              </a>
            ) : (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft hover:bg-accent-soft hover:text-ink"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

export function NavBar({
  siteName,
  logoUrl,
  groups,
  exploreLinks,
}: {
  siteName: string
  logoUrl?: string
  groups: NavGroup[]
  exploreLinks: NavLink[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const allGroups: NavGroup[] = [
    ...groups,
    { title: 'Explore', links: exploreLinks },
    { title: 'Blog', links: [{ label: 'Blog', href: '/blog' }] },
    { title: 'About', links: [{ label: 'About', href: '/about' }] },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Link href="/" aria-label={`${siteName} — home`} className="flex shrink-0 items-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={150}
              height={44}
              priority
              className="h-9 w-auto sm:h-10"
            />
          ) : (
            <BrandLogo />
          )}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {allGroups.map((group) => (
            <DesktopItem key={group.title} group={group} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-full p-2.5 text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <SearchIcon />
          </Link>
          <Link href="/promote" className="btn-primary hidden whitespace-nowrap sm:inline-flex">
            Promote your business
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="rounded-full p-2.5 text-ink transition-colors hover:bg-accent-soft lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto border-t border-line bg-bg lg:hidden">
          <nav aria-label="Mobile" className="container-site space-y-6 py-6">
            {allGroups.map((group) => (
              <div key={group.title}>
                {group.links.length <= 1 ? (
                  <Link
                    href={group.links[0]?.href ?? '/'}
                    className="block py-1 font-display text-xl font-semibold text-ink"
                  >
                    {group.title}
                  </Link>
                ) : (
                  <>
                    <p className="kicker mb-2">{group.title}</p>
                    <ul className="space-y-1">
                      {group.links.map((link) => (
                        <li key={link.href + link.label}>
                          {isExternal(link.href) ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener"
                              className="flex items-center gap-2 py-1.5 text-lg text-ink-soft"
                            >
                              {link.label}
                              <ExternalIcon width={15} height={15} className="text-muted" />
                            </a>
                          ) : (
                            <Link href={link.href} className="block py-1.5 text-lg text-ink-soft">
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
            <Link href="/promote" className="btn-primary w-full">
              Promote your business
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
