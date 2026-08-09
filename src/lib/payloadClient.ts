import { getPayload } from 'payload'
import config from '@payload-config'

// getPayload caches the initialized instance globally, so this is cheap to
// call from every server component / route handler.
export const getPayloadClient = () => getPayload({ config })
