import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import type { CollectionBeforeChangeHook, FieldHook } from 'payload'

// ------------------------------- excerpt ----------------------------------

const collectText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const record = node as { text?: unknown; children?: unknown[] }
  if (typeof record.text === 'string') return record.text
  if (Array.isArray(record.children)) return record.children.map(collectText).join('')
  return ''
}

// Plain text of the first real paragraph of a Lexical document, clipped at a
// word boundary
export const excerptFromLexical = (content: unknown, max = 200): string | undefined => {
  const root = (content as { root?: { children?: unknown[] } } | null)?.root
  if (!root?.children) return undefined
  for (const child of root.children) {
    if ((child as { type?: string }).type !== 'paragraph') continue
    const text = collectText(child).replace(/\s+/g, ' ').trim()
    if (text.length < 20) continue
    if (text.length <= max) return text
    const cut = text.slice(0, max)
    const boundary = cut.lastIndexOf(' ')
    return `${cut.slice(0, boundary > 60 ? boundary : max).trim()}…`
  }
  return undefined
}

export const fillExcerpt: CollectionBeforeChangeHook = ({ data }) => {
  if (data && !(typeof data.excerpt === 'string' && data.excerpt.trim())) {
    const excerpt = excerptFromLexical(data.content)
    if (excerpt) data.excerpt = excerpt
  }
  return data
}

// ------------------------------ publishedAt --------------------------------

// An empty date breaks date sorting (the post sticks as "most recent")
export const fillPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data && !data.publishedAt) data.publishedAt = new Date().toISOString()
  return data
}

export const clearOnDuplicate: FieldHook = () => null

export const suffixOnDuplicate: FieldHook = ({ value }) =>
  typeof value === 'string' && value ? `${value}-copy` : value

// ------------------------------ HTML source --------------------------------

// `contentHtml` is a virtual field: HTML pasted there replaces the rich text
// content on save and is never stored itself
export const applyHtmlSource: CollectionBeforeChangeHook = async ({ data, req }) => {
  const html = data?.contentHtml
  if (typeof html !== 'string' || !html.trim()) return data
  const editorConfig = await editorConfigFactory.default({ config: req.payload.config })
  const state = convertHTMLToLexical({ editorConfig, html, JSDOM })
  if (state?.root?.children?.length) data.content = state
  data.contentHtml = null
  return data
}

// -------------------------------- preview ----------------------------------

// Null-safe preview URL: only when the document has a slug and a preview
// secret exists. Goes through the Next.js draft-mode endpoint so the page is
// rendered fresh instead of served from the static cache.
export const previewUrl = (
  doc: Record<string, unknown> | undefined,
  pathFor: (slug: string) => string,
): string | null => {
  const slug = doc && typeof doc.slug === 'string' ? doc.slug.trim() : ''
  if (!slug) return null
  const secret = process.env.PREVIEW_SECRET || process.env.REVALIDATE_SECRET
  if (!secret) return null
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
  return `${base}/api/preview?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(pathFor(slug))}`
}
