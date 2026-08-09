import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps): IconProps => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...props,
})

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const MenuIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 12h16m0 0-6-6m6 6-6 6" />
  </svg>
)

export const PhoneIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
)

export const MailIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

export const GlobeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
)

export const MapPinIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const CalendarIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4m8-4v4M3 10h18" />
  </svg>
)

export const TicketIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
    <path d="M13 6v2m0 3v2m0 3v2" strokeDasharray="0.1 3.4" />
  </svg>
)

export const ExternalIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M14 5h5v5M19 5l-8 8M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
)

export const FacebookIcon = (props: IconProps) => (
  <svg {...base({ ...props, fill: 'currentColor', stroke: 'none' })}>
    <path d="M14 8.5V7a1 1 0 0 1 1-1h1.5V3H14a4 4 0 0 0-4 4v1.5H8V12h2v9h4v-9h2.3l.7-3.5H14Z" />
  </svg>
)

export const InstagramIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

export const TikTokIcon = (props: IconProps) => (
  <svg {...base({ ...props, fill: 'currentColor', stroke: 'none' })}>
    <path d="M16.6 3c.4 1.9 1.6 3.2 3.4 3.4v3.1c-1.3 0-2.5-.4-3.4-1v5.7A5.8 5.8 0 1 1 10 8.4v3.2a2.6 2.6 0 1 0 3.4 2.5V3h3.2Z" />
  </svg>
)

export const YouTubeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="6" width="18" height="12" rx="3" />
    <path d="m10.5 9.5 4.5 2.5-4.5 2.5v-5Z" fill="currentColor" stroke="none" />
  </svg>
)

export const LinkedInIcon = (props: IconProps) => (
  <svg {...base({ ...props, fill: 'currentColor', stroke: 'none' })}>
    <path d="M6.5 8.8H3.6V21h2.9V8.8ZM5 7.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM13 8.8h-2.8V21H13v-6.3c0-2.6 3.4-2.8 3.4 0V21h2.9v-7.3c0-4.5-4.9-4.3-6.3-2.1V8.8Z" />
  </svg>
)
