// Boot diagnostic: log which database hosts this deployment resolved,
// with credentials masked. Helps debug Railway reference-variable issues.
const mask = (value) => String(value ?? '(empty)').replace(/:[^:@/]+@/, ':***@')
console.log('[boot] DATABASE_URL =', mask(process.env.DATABASE_URL))
console.log('[boot] DATABASE_PUBLIC_URL =', mask(process.env.DATABASE_PUBLIC_URL))
