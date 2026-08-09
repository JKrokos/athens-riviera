import { getPayloadClient } from '../../../lib/payloadClient'
import { getImportStatus, startBackgroundImport } from '../../../lib/importer'

export const dynamic = 'force-dynamic'

const authorized = (request: Request): boolean => {
  const secret = new URL(request.url).searchParams.get('secret')
  return Boolean(process.env.IMPORT_SECRET) && secret === process.env.IMPORT_SECRET
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 })
  return Response.json({ ok: true, status: getImportStatus() })
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 })
  const payload = await getPayloadClient()
  const started = startBackgroundImport(payload)
  return Response.json({ ok: true, started, status: getImportStatus() })
}
