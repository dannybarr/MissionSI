import { useId } from 'react'

/** 86 × 55 mm card drawn at 10 units per millimetre, so mm placements map 1:1. */
const W = 860
const H = 550

/** Outer rim. One machined notch on each long edge, one on each short edge. Units are 0.1 mm. */
function outline() {
  const r = 32
  const x1 = 307
  const x2 = 528
  const nd = 21
  const ramp = 14
  const y1 = 170
  const y2 = 360
  const sd = 17
  const sr = 12
  return [
    `M${r} 0`,
    `H${x1 - ramp}`,
    `L${x1} ${nd}`,
    `H${x2}`,
    `L${x2 + ramp} 0`,
    `H${W - r}`,
    `A${r} ${r} 0 0 1 ${W} ${r}`,
    `V${y1 - sr}`,
    `L${W - sd} ${y1}`,
    `V${y2}`,
    `L${W} ${y2 + sr}`,
    `V${H - r}`,
    `A${r} ${r} 0 0 1 ${W - r} ${H}`,
    `H${x2 + ramp}`,
    `L${x2} ${H - nd}`,
    `H${x1}`,
    `L${x1 - ramp} ${H}`,
    `H${r}`,
    `A${r} ${r} 0 0 1 0 ${H - r}`,
    `V${y2 + sr}`,
    `L${sd} ${y2}`,
    `V${y1}`,
    `L0 ${y1 - sr}`,
    `V${r}`,
    `A${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join('')
}

function rounded(inset: number) {
  const r = 26
  const L = inset
  const T = inset
  const R = W - inset
  const B = H - inset
  return `M${L + r} ${T}H${R - r}A${r} ${r} 0 0 1 ${R} ${T + r}V${B - r}A${r} ${r} 0 0 1 ${R - r} ${B}H${L + r}A${r} ${r} 0 0 1 ${L} ${B - r}V${T + r}A${r} ${r} 0 0 1 ${L + r} ${T}Z`
}

const OUTER = outline()
const GROOVE = rounded(30)
const FACE = rounded(36)

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

export function CardFace({ alt = 'Mission card: graphite, inward-cut edges, Earth mark, Mission wordmark and DB initials', marks = true, plug = false, status = 0, ring = false, className = '' }: CardFaceProps) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}-${uid}`
  const lit = Math.max(0, Math.min(1, status))
  return (
    <figure className={`card-face ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={alt}>
        <defs>
          <linearGradient id={id('rim')} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#3a3c40" />
            <stop offset="0.18" stopColor="#1a1c20" />
            <stop offset="1" stopColor="#101214" />
          </linearGradient>
          <linearGradient id={id('face')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e2024" />
            <stop offset="0.55" stopColor="#16181b" />
            <stop offset="1" stopColor="#121416" />
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
            <circle cx="729" cy="123" r="56" />
          </clipPath>
        </defs>

        {plug && (
          <g className="card-port">
            <rect x="-6" y="232" width="28" height="86" rx="14" fill={`url(#${id('plug')})`} />
            <rect x="2" y="244" width="14" height="62" rx="8" fill="#0c0d0f" />
            <rect x="6" y="258" width="8" height="14" rx="1" fill="#c7a46a" />
            <rect x="6" y="276" width="8" height="14" rx="1" fill="#c7a46a" opacity="0.7" />
          </g>
        )}

        <path d={OUTER} fill={`url(#${id('rim')})`} />
        <path d={OUTER} fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />
        <path d={GROOVE} fill="none" stroke="#111113" strokeWidth="2.5" />
        <path d={rounded(16)} fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />
        <path d={FACE} fill={`url(#${id('face')})`} />
        <g clipPath={`url(#${id('clip')})`}>
          <rect width={W} height={H} fill={`url(#${id('sheen')})`} />
        </g>
        <path d={FACE} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="2" />

        {marks && (
          <g className="card-marks">
            <image href="/assets/nasa/earth-240.webp" x="673" y="67" width="112" height="112" clipPath={`url(#${id('earth')})`} preserveAspectRatio="xMidYMid slice" />
            <text x="210" y="148" textAnchor="middle" fill="#c8c9cd" fontFamily="Geist, 'Schibsted Grotesk', sans-serif" fontSize="46" fontWeight="500">
              Mission
            </text>
            <text x="725" y="440" textAnchor="middle" fill="#c4c5c9" fontFamily="Geist, sans-serif" fontSize="58" fontWeight="500">
              DB
            </text>
            <text x="725" y="492" textAnchor="middle" fill="#8d8e93" fontFamily="'Geist Mono', ui-monospace, monospace" fontSize="9" letterSpacing="3.2">
              MS-01
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
