// Ensure the database named in DATABASE_URL exists before `payload migrate`
// runs. Lets this app share a Postgres instance with other services: point
// DATABASE_URL at the instance with any database name and it is created on
// first boot. No-op when the database already exists.
import pg from 'pg'

const raw = process.env.DATABASE_URL
if (!raw) {
  console.log('[ensure-db] DATABASE_URL not set; skipping')
  process.exit(0)
}

const url = new URL(raw)
const dbName = decodeURIComponent(url.pathname.replace(/^\//, '')) || 'postgres'

// Admin connection: DATABASE_ADMIN_URL if provided, else the same server's
// maintenance database.
const adminUrl = new URL(process.env.DATABASE_ADMIN_URL ?? raw)
if (!process.env.DATABASE_ADMIN_URL) adminUrl.pathname = '/postgres'

const client = new pg.Client({
  connectionString: adminUrl.toString(),
  connectionTimeoutMillis: 15000,
})

try {
  await client.connect()
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
  if (rows.length > 0) {
    console.log(`[ensure-db] database "${dbName}" exists`)
  } else {
    // CREATE DATABASE cannot be parameterized; the name comes from our own
    // DATABASE_URL, quoted defensively.
    await client.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`)
    console.log(`[ensure-db] created database "${dbName}"`)
  }
} catch (error) {
  // Leave the loud failure to `payload migrate` — this step must never mask
  // the real connection error.
  console.warn(`[ensure-db] skipped (${error.code ?? error.message})`)
} finally {
  await client.end().catch(() => {})
}
