// Optional URL fields: empty is fine, anything else must be an absolute
// http(s) URL so it renders as a working link
export const validateOptionalUrl = (value: null | string | undefined): string | true => {
  if (!value || !value.trim()) return true
  try {
    const url = new URL(value.trim())
    if (url.protocol === 'http:' || url.protocol === 'https:') return true
  } catch {
    // fall through
  }
  return 'Enter a full URL starting with https://'
}
