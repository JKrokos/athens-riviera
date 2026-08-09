import type { FieldHook } from 'payload'

// Latin-only slugs for generated values. Imported WordPress slugs (which may
// contain Greek characters) are kept verbatim so legacy URLs keep working.
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

export const formatSlugHook =
  (fallbackField: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) {
      return value.trim().toLowerCase()
    }
    const fallback = data?.[fallbackField]
    if (typeof fallback === 'string' && fallback.length > 0) {
      return slugify(fallback)
    }
    return value
  }
