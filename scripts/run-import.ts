// Manual/import test runner: `npx payload run scripts/run-import.ts`
import { getPayload } from 'payload'
import config from '@payload-config'
import { runWordPressImport } from '../src/lib/importer'

const payload = await getPayload({ config })
const summary = await runWordPressImport(payload, (message) => console.log(message))
console.log('SUMMARY', JSON.stringify(summary, null, 2))
process.exit(0)
