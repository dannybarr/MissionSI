import { useId } from 'react'

/** 86 × 55 mm card drawn at 10 units per millimetre, so mm placements map 1:1. */
const W = 860
const H = 550

function outline(inset: number) {
  const i = inset
  const r = Math.max(6, 36 - i * 0.9)
  const nd = 17
  const sd = 13
  const s = 22
  const x1 = 300
  const x2 = 560
  const y1 = 178
  const y2 = 372
  const L = i
  const T = i
  const R = W - i
  const B = H - i
  return [
    `M${L + r} ${T}`,
    `H${x1}`,
    `L${x1 + s} ${T + nd}`,
    `H${x2 - s}`,
    `L${x2} ${T}`,
    `H${R - r}`,
    `A${r} ${r} 0 0 1 ${R} ${T + r}`,
    `V${y1}`,
    `L${R - sd} ${y1 + s}`,
    `V${y2 - s}`,
    `L${R} ${y2}`,
    `V${B - r}`,
    `A${r} ${r} 0 0 1 ${R - r} ${B}`,
    `H${x2}`,
    `L${x2 - s} ${B - nd}`,
    `H${x1 + s}`,
    `L${x1} ${B}`,
    `H${L + r}`,
    `A${r} ${r} 0 0 1 ${L} ${B - r}`,
    `V${y2}`,
    `L${L + sd} ${y2 - s}`,
    `V${y1 + s}`,
    `L${L} ${y1}`,
    `V${T + r}`,
    `A${r} ${r} 0 0 1 ${L + r} ${T}`,
    'Z',
  ].join('')
}

const OUTER = outline(0)
const GROOVE = outline(13)
const FACE = outline(22)

export interface CardFaceProps {
  alt?: string
  /** Earth, wordmark and initials, as in the reference design. */
  marks?: boolean
  /** Built-in USB-C plug on the left short edge. */
  plug?: boolean
  /** 0 = off, 1 = fully lit. */
  status?: number
  /** The status light ring in the top-right corner. */
  ring?: boolean
  className?: string
}

export function CardFace({ alt = 'Mission card: graphite, inward-cut edges, Earth mark, Mission wordmark and DB initials', marks = true, plug = false, status = 0, ring = true, className = '' }: CardFaceProps) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}-${uid}`
  const lit = Math.max(0, Math.min(1, status))
  return (
    <figure className={`card-face ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={alt}>
        <defs>
          <linearGradient id={id('rim')} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#3a3a3e" />
            <stop offset="0.5" stopColor="#252528" />
            <stop offset="1" stopColor="#1b1b1d" />
          </linearGradient>
          <linearGradient id={id('face')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4a4b50" />
            <stop offset="0.55" stopColor="#3e3f44" />
            <stop offset="1" stopColor="#36373b" />
          </linearGradient>
          <linearGradient id={id('sheen')} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.09" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.8" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={id('plug')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9eaec" />
            <stop offset="0.45" stopColor="#a9abaf" />
            <stop offset="0.55" stopColor="#8d8f93" />
            <stop offset="1" stopColor="#c9cacd" />
          </linearGradient>
          <radialGradient id={id('glow')}>
            <stop offset="0" stopColor="#f2f8ff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#bcd8ff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#bcd8ff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={id('clip')}>
            <path d={FACE} />
          </clipPath>
          <clipPath id={id('earth')}>
            <circle cx="710" cy="105" r="50" />
          </clipPath>
        </defs>

        {plug && (
          <g className="card-port">
            <rect x="6" y="248" width="16" height="54" rx="6" fill="#141416" />
            <rect x="10" y="258" width="36" height="34" rx="10" fill="#0c0c0d" />
            <rect x="18" y="268" width="22" height="6" rx="1" fill="#c7a46a" opacity="0.8" />
            <rect x="18" y="278" width="22" height="6" rx="1" fill="#c7a46a" opacity="0.55" />
          </g>
        )}

        <path d={OUTER} fill={`url(#${id('rim')})`} />
        <path d={OUTER} fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />
        <path d={GROOVE} fill="none" stroke="#111113" strokeWidth="2.5" />
        <path d={outline(14.5)} fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
        <path d={FACE} fill={`url(#${id('face')})`} />
        <g clipPath={`url(#${id('clip')})`}>
          <rect width={W} height={H} fill={`url(#${id('sheen')})`} />
        </g>
        <path d={FACE} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="2" />

        {marks && (
          <g className="card-marks">
            <image href="/assets/nasa/earth-240.webp" x="660" y="55" width="100" height="100" clipPath={`url(#${id('earth')})`} preserveAspectRatio="xMidYMid slice" />
            <text x="180" y="139" textAnchor="middle" fill="#a7a7ac" fontFamily="Geist, 'Schibsted Grotesk', sans-serif" fontSize="70" fontWeight="400" letterSpacing="-1.5">
              Mission
            </text>
            <text x="740" y="448" textAnchor="middle" fill="#a7a7ac" fontFamily="Geist, sans-serif" fontSize="92" fontWeight="400" letterSpacing="-2">
              DB
            </text>
            <text x="808" y="514" textAnchor="end" fill="#6f6f74" fontFamily="'Geist Mono', ui-monospace, monospace" fontSize="10.5" letterSpacing="1.6">
              MISSION MS-01 / DESIGNED IN STUDIO
            </text>
          </g>
        )}

        {ring && <g className="card-status">
          {lit > 0 && <circle className="st-glow" cx="790" cy="65" r={34} fill={`url(#${id('glow')})`} opacity={lit} />}
          <circle className="st-ring" cx="790" cy="65" r="13" fill="none" stroke={lit > 0.02 ? '#dfeeff' : '#6a6a70'} strokeOpacity={0.6 + lit * 0.4} strokeWidth="2.6" />
          <circle className="st-dot" cx="790" cy="65" r="6.5" fill="#f4f9ff" opacity={lit} />
        </g>}
      </svg>
    </figure>
  )
}
