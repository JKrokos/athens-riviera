// Per-site font pairing. The sister sites swap these two exports while every
// component keeps using the --font-display / --font-body variables.
// Nunito's rounded forms echo the Athens Riviera badge logo.
import { Inter, Nunito } from 'next/font/google'

export const displayFont = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const bodyFont = Inter({
  subsets: ['latin', 'greek'],
  variable: '--font-body',
  display: 'swap',
})
