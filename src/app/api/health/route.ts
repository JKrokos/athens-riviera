import { getPayloadClient } from '../../../lib/payloadClient'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users' })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'unknown' },
      { status: 503 },
    )
  }
}
