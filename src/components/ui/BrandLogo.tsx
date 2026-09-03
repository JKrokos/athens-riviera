// Per-site brand lockup: the official round Athens Riviera badge next to a
// rounded wordmark. Used wherever Site Settings has no uploaded logo.
import Image from 'next/image'

export function BrandLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 leading-none">
      <Image
        src="/images/logo.png"
        alt=""
        width={40}
        height={40}
        priority
        className="h-10 w-10 rounded-full object-contain"
      />
      <span className="flex flex-col">
        <span
          className={`font-display text-xl font-extrabold tracking-tight ${
            onDark ? 'text-white' : 'text-ink'
          }`}
        >
          Athens<span className="text-accent"> Riviera</span>
        </span>
        <span className="mt-0.5 h-[3px] w-full rounded-full bg-gradient-to-r from-accent via-[#e8b33a] to-[#e8b33a]" />
      </span>
    </span>
  )
}
