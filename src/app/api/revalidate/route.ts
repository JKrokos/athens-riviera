import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const secret = new URL(request.url).searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ ok: false }, { status: 401 })
  }
  revalidatePath('/', 'layout')
  return Response.json({ ok: true, revalidated: 'all' })
}
