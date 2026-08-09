'use client'

import { useState } from 'react'

type Topic = 'general' | 'promote'
type Status = 'idle' | 'sending' | 'sent' | 'error'

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'

export function ContactForm({ topic }: { topic: Topic }) {
  const [status, setStatus] = useState<Status>('idle')

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setStatus('sending')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, topic }),
      })
      if (!response.ok) throw new Error('failed')
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-card border border-accent/40 bg-accent-soft p-8 text-center">
        <p className="font-display text-xl font-semibold text-ink">Thank you!</p>
        <p className="mt-2 text-sm text-ink-soft">
          Your message has been received — we’ll get back to you shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-sm font-medium text-ink">
            Name *
          </label>
          <input id="cf-name" name="name" required maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-sm font-medium text-ink">
            Email *
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            maxLength={160}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-phone" className="mb-1.5 block text-sm font-medium text-ink">
            Phone
          </label>
          <input id="cf-phone" name="phone" maxLength={40} className={inputClass} />
        </div>
        {topic === 'promote' ? (
          <div>
            <label htmlFor="cf-business" className="mb-1.5 block text-sm font-medium text-ink">
              Business name *
            </label>
            <input id="cf-business" name="business" required maxLength={160} className={inputClass} />
          </div>
        ) : null}
      </div>
      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-sm font-medium text-ink">
          Message *
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          className={inputClass}
        />
      </div>
      {/* Honeypot — real visitors never see or fill this */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-60">
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {status === 'error' ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          Something went wrong — please try again or email us directly.
        </p>
      ) : null}
    </form>
  )
}
