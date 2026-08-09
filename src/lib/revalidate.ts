// Invalidate the whole site after a content change. Edits are infrequent and
// pages regenerate lazily on the next request, so one broad invalidation is
// simpler and safer than tracking which routes each document appears on.
// Outside a request scope (CLI, boot-time import) revalidatePath throws —
// time-based ISR covers those cases, so the error is deliberately swallowed.
export const revalidateSite = async (): Promise<void> => {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch {
    // no-op: not running inside a Next.js request context
  }
}
