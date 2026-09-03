import baseSlugify from '@sindresorhus/slugify'
import type { FieldHook } from 'payload'

// Latin-only slugs for generated values — Greek is transliterated
// (Καλημέρα → kalimera). Imported WordPress slugs (which may contain Greek
// characters) are kept verbatim so legacy URLs keep working.
export const slugify = (value: string): string => baseSlugify(value, { decamelize: false })

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
