import type { Metadata } from 'next'

import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { CookieSettingsButton } from '../../../components/CookieConsent'
import { getSettings } from '../../../lib/data'
import { buildMetadata } from '../../../lib/seo'
import { site } from '../../../site.config'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy & Cookie Policy',
  description: `How ${site.name} (${site.domain}) handles personal data and cookies.`,
  path: '/privacy-policy',
})

export default async function PrivacyPolicyPage() {
  const settings = await getSettings()
  const email = settings.contactEmail || site.defaultContact.email
  const name = settings.siteName || site.name

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ name: 'Privacy & Cookie Policy' }]} />
        <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
          Privacy &amp; Cookie Policy
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: 9 August 2026</p>

        <div className="prose-site mt-8">
          <h2>Who we are</h2>
          <p>
            This website, <strong>{site.domain}</strong> (“{name}”, “we”, “us”), is a destination
            guide for {site.place.name}, {site.place.countryName}. For any privacy question, or to
            exercise any of your rights, contact us at{' '}
            <a href={`mailto:${email}`}>{email}</a>.
          </p>

          <h2>What data we collect</h2>
          <p>We keep data collection to a minimum:</p>
          <ul>
            <li>
              <strong>Contact &amp; promotion forms.</strong> When you submit a form we store the
              details you provide (name, email, phone, business name and your message) so we can
              respond to your enquiry. Legal basis: our legitimate interest in answering you
              (Art. 6(1)(f) GDPR) and, where your enquiry leads to an agreement, contract
              performance (Art. 6(1)(b)).
            </li>
            <li>
              <strong>Analytics (only with your consent).</strong> If you accept cookies, we use
              Google Analytics 4 with IP anonymisation to understand how the site is used. Legal
              basis: consent (Art. 6(1)(a)). You can withdraw it at any time from the cookie
              settings.
            </li>
            <li>
              <strong>Technical logs.</strong> Our hosting provider (Railway) processes standard
              server logs (IP address, requested page, time) for security and reliability.
            </li>
          </ul>
          <p>We do not sell personal data, and we do not use it for automated decision-making.</p>

          <h2>Cookies &amp; similar technologies</h2>
          <p>
            When you first visit, no analytics run. A banner asks for your choice, which we
            remember in your browser:
          </p>
          <ul>
            <li>
              <strong>cookie-consent</strong> (local storage) — remembers whether you accepted or
              declined. Kept until you clear your browser data.
            </li>
            <li>
              <strong>_ga / _ga_*</strong> (cookies, only after you accept) — set by Google
              Analytics to distinguish visitors. Expire after up to 2 years.
            </li>
            <li>
              <strong>Google Maps</strong> — maps on listing pages load only after you press “Show
              map”; Google may then set its own cookies under{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">
                Google’s privacy policy
              </a>
              .
            </li>
          </ul>
          <p>
            You can change your choice at any time: <CookieSettingsButton className="font-medium text-accent-strong underline underline-offset-2" />
          </p>

          <h2>Who we share data with</h2>
          <ul>
            <li>
              <strong>Railway</strong> (hosting &amp; database) — processes all site data on our
              behalf.
            </li>
            <li>
              <strong>Google LLC</strong> (Analytics, Maps) — only as described above and only
              after your consent/action. Transfers to the US are covered by the EU–US Data Privacy
              Framework.
            </li>
          </ul>

          <h2>How long we keep data</h2>
          <ul>
            <li>Form submissions: up to 24 months after our last exchange, then deleted.</li>
            <li>Analytics data: up to 14 months (Google Analytics retention setting).</li>
          </ul>

          <h2>Your rights</h2>
          <p>
            Under the GDPR you can request access to, correction or deletion of your personal
            data, restriction of or objection to its processing, and a portable copy. Email{' '}
            <a href={`mailto:${email}`}>{email}</a> and we will respond within a month. You can
            also lodge a complaint with the Hellenic Data Protection Authority (
            <a href="https://www.dpa.gr" target="_blank" rel="noopener">
              dpa.gr
            </a>
            ).
          </p>

          <h2>External links</h2>
          <p>
            Listing pages link to the websites, booking pages and social media of the businesses
            we feature. Those sites have their own privacy policies which we do not control.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy as the site evolves; the date above always reflects the
            latest version.
          </p>
        </div>
      </div>
    </div>
  )
}
