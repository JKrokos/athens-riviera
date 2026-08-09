'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cookie-consent'
const OPEN_EVENT = 'cookie-consent:open'
const CHANGE_EVENT = 'cookie-consent:change'

type ConsentValue = 'granted' | 'denied'

const readConsent = (): ConsentValue | null => {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'granted' || value === 'denied' ? value : null
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      Cookie settings
    </button>
  )
}

// GDPR consent banner. Analytics (below) loads only after the visitor
// explicitly accepts; declining stores the choice and nothing is loaded.
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readConsent() === null) setVisible(true)
    const open = () => setVisible(true)
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  const choose = (value: ConsentValue) => {
    window.localStorage.setItem(STORAGE_KEY, value)
    window.dispatchEvent(new Event(CHANGE_EVENT))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card-hover sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-ink-soft">
          We use cookies to understand how visitors use the site — only after you agree. Read our{' '}
          <Link href="/privacy-policy" className="font-medium text-accent-strong underline underline-offset-2">
            privacy &amp; cookie policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose('denied')} className="btn-ghost">
            Decline
          </button>
          <button type="button" onClick={() => choose('granted')} className="btn-primary">
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

// Loads GA4 only when a measurement ID is configured AND consent is granted.
export function Analytics({ gaId }: { gaId?: string | null }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(readConsent() === 'granted')
    sync()
    window.addEventListener(CHANGE_EVENT, sync)
    return () => window.removeEventListener(CHANGE_EVENT, sync)
  }, [])

  if (!gaId || !enabled) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
      </Script>
    </>
  )
}
