import { getPayloadClient } from '../../../lib/payloadClient'

export const dynamic = 'force-dynamic'

const isNonEmptyString = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // Honeypot: bots fill the hidden "website" field — pretend success
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return Response.json({ ok: true })
  }

  const { name, email, phone, business, message } = body
  const topic = body.topic === 'promote' ? 'promote' : 'general'

  if (!isNonEmptyString(name, 120) || !isNonEmptyString(message, 4000)) {
    return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
  }
  if (!isNonEmptyString(email, 160) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: 'Invalid email' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'contact-submissions',
    data: {
      name: name.trim(),
      email: email.trim(),
      phone: isNonEmptyString(phone, 40) ? phone.trim() : undefined,
      business: isNonEmptyString(business, 160) ? business.trim() : undefined,
      topic,
      message: message.trim(),
    },
  })

  return Response.json({ ok: true })
}
