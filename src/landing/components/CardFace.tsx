import { useId } from 'react'

/** The deep-blue card with inward cuts, used as the hero object and on the tray. */
export function CardFace({ alt = 'Mission card, deep blue with inward-cut edges', marks = true }: { alt?: string; marks?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const rim = `rim-${uid}`
  const face = `face-${uid}`
  const sheen = `sheen-${uid}`
  const clip = `clip-${uid}`
  return (
    <figure className="card-face">
      <svg viewBox="0 0 860 540" role="img" aria-label={alt}>
        <defs>
          <linearGradient id={rim} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c5c7cb" />
            <stop offset="0.45" stopColor="#8d9096" />
            <stop offset="1" stopColor="#5e6166" />
          </linearGradient>
          <linearGradient id={face} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1d4a92" />
            <stop offset="0.5" stopColor="#17356f" />
            <stop offset="1" stopColor="#10264f" />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={clip}>
            <path d="M48 28H330c18 0 28-28 100-28s82 28 100 28H812c18 0 28 14 28 32v150c0 18 20 28 20 60s-20 42-20 60v150c0 18-10 32-28 32H530c-18 0-28 28-100 28s-82-28-100-28H48c-18 0-28-14-28-32V360c0-18-20-28-20-60s20-42 20-60V60c0-18 10-32 28-32z" />
          </clipPath>
        </defs>
        <path
          d="M48 18H330c18 0 28-18 100-18s82 18 100 18H812c24 0 38 16 38 40v148c0 16 22 26 22 64s-22 48-22 64v148c0 24-14 40-38 40H530c-18 0-28 18-100 18s-82-18-100-18H48c-24 0-38-16-38-40V364c0-16-22-26-22-64s22-48 22-64V58c0-24 14-40 38-40z"
          fill={`url(#${rim})`}
        />
        <g clipPath={`url(#${clip})`}>
          <rect width="860" height="540" fill={`url(#${face})`} />
          <rect width="860" height="540" fill={`url(#${sheen})`} />
          {marks && (
            <>
              <image href="/assets/nasa/earth.webp" x="620" y="78" width="132" height="132" />
              <text x="78" y="168" fill="#f4f1ea" fontFamily="Geist, Schibsted Grotesk, sans-serif" fontSize="54" fontWeight="500" letterSpacing="-1">
                Mission
              </text>
              <text x="690" y="430" fill="#f4f1ea" fontFamily="Geist, sans-serif" fontSize="64" fontWeight="500" letterSpacing="-1">
                DB
              </text>
              <path d="M430 470c-22 0-40 14-40 32h18c0-10 10-16 22-16s22 6 22 16h18c0-18-18-32-40-32z" fill="#d9d4c8" opacity="0.85" />
            </>
          )}
        </g>
      </svg>
    </figure>
  )
}
