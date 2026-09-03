import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

// Admin "Preview" target: turns on draft mode (pages render fresh instead of
// from the static cache) and jumps to the document's page.
// /api/preview?secret=…&path=/blog/my-post   — enter
// /api/preview?exit=1&path=/blog/my-post     — leave draft mode
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || '/'
  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid path', { status: 400 })
  }

  const draft = await draftMode()
  if (searchParams.get('exit')) {
    draft.disable()
    redirect(path)
  }

  const expected = process.env.PREVIEW_SECRET || process.env.REVALIDATE_SECRET
  if (!expected || searchParams.get('secret') !== expected) {
    return new Response('Invalid preview token', { status: 401 })
  }
  draft.enable()
  redirect(path)
}
