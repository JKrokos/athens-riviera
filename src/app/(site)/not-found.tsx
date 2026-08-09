import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center py-24 text-center sm:py-32">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">
        This page has wandered off
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-soft">
        The page you’re looking for doesn’t exist or has moved. Let’s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back home
        </Link>
        <Link href="/explore" className="btn-ghost">
          Explore categories
        </Link>
        <Link href="/search" className="btn-ghost">
          Search
        </Link>
      </div>
    </div>
  )
}
