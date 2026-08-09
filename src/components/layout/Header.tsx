import { getSettings } from '../../lib/data'
import { mediaUrl } from '../../lib/media'
import { site } from '../../site.config'
import { NavBar, type NavGroup } from './NavBar'

const resolveHref = (link: {
  category?: unknown
  area?: unknown
  url?: string | null
}): string => {
  if (link.category && typeof link.category === 'object') {
    return `/category/${(link.category as { slug?: string }).slug ?? ''}`
  }
  if (link.area && typeof link.area === 'object') {
    return `/region/${(link.area as { slug?: string }).slug ?? ''}`
  }
  return link.url || '/'
}

export async function Header() {
  const settings = await getSettings()

  const groups: NavGroup[] = (settings.navGroups ?? []).map((group) => ({
    title: group.title,
    links: (group.links ?? []).map((link) => ({
      label: link.label,
      href: resolveHref(link),
    })),
  }))

  const exploreLinks = (settings.exploreLinks ?? []).map((link) => ({
    label: link.name,
    href: link.url,
  }))
  if (exploreLinks.length === 0) {
    exploreLinks.push(...site.network.map((n) => ({ label: n.name, href: n.url })))
  }

  return (
    <NavBar
      siteName={settings.siteName || site.name}
      logoUrl={mediaUrl(settings.logo) ?? undefined}
      groups={groups}
      exploreLinks={exploreLinks}
    />
  )
}
