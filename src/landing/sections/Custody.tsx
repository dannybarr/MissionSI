import { EASE, gsap } from '@/landing/lib/motion'
import './custody.css'

/** Where each cloud floats before it is packed: top-left of its 160 x 84 box, plus scale. */
const CLOUDS = [
  { x: 30, y: 30, s: 1.06, from: -1 },
  { x: 444, y: 10, s: 1.14, from: 1 },
  { x: 240, y: 70, s: 0.84, from: -1 },
  { x: 480, y: 152, s: 0.78, from: 1 },
  { x: 6, y: 172, s: 0.72, from: -1 },
]

/** Centre of the case opening, in viewBox units. A cloud box is 160 x 84, scaled about its centre. */
const MOUTH = { x: 320 - 80, y: 262 - 46 }
const SINK = 318 - 46

/** A vertical squash about a horizontal hinge line at y, as a plain SVG matrix so it scrubs cleanly to near zero. */
const hinge = (s: number, y: number) => `matrix(1 0 0 ${s} 0 ${(y * (1 - s)).toFixed(3)})`

/**
 * Adds the custody story to the Statement timeline: memory scattered across clouds,
 * a briefcase arrives, opens, the clouds are packed in, and it clamps shut.
 * Returns the time the story ends so the caller can sequence after it.
 */
export function addCustody(tl: gsap.core.Timeline, root: HTMLElement, at = 0) {
  const q = gsap.utils.selector(root)
  const clouds = q('.cs-cloud')
  const floats = q('.cs-float')
  const caseParts = q('.cs-case')
  const lidClosed = q('.cs-lid-closed')
  const lidOpen = q('.cs-lid-open')
  const latches = q('.cs-latch')
  const shadow = q('.cs-ground')
  const art = q('.custody-art')
  const [before, after] = q('.custody-note')

  // Independent idle drift, on an inner group so the scrubbed timeline owns the outer transform.
  floats.forEach((el, i) => {
    gsap.to(el, { y: i % 2 ? 7 : -7, x: i % 2 ? -4 : 5, duration: 2.6 + i * 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 })
  })

  // Hinges and pivots are fixed once, at full scale, so later squashes cannot skew them.
  gsap.set(shadow, { svgOrigin: '320 412' })
  latches.forEach((el) => gsap.set(el, { transformOrigin: '50% 100%' }))
  gsap.set(art, { transformOrigin: '50% 92%' })

  // 1. Memory, scattered across other people's clouds.
  clouds.forEach((el, i) => {
    const c = CLOUDS[i]
    tl.fromTo(
      el,
      { x: c.x + c.from * 220, y: c.y + 16, scale: c.s * 0.92, autoAlpha: 0 },
      { x: c.x, y: c.y, scale: c.s, autoAlpha: 1, duration: 0.7, ease: EASE.out, immediateRender: true },
      at + i * 0.08,
    )
  })
  tl.fromTo(before, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.out }, at + 0.2)

  // 2. The case arrives, closed.
  tl.fromTo(caseParts, { y: 150, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: EASE.arrive }, at + 0.7)
  tl.fromTo(shadow, { scaleX: 0.4, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.6, ease: EASE.arrive }, at + 0.7)

  // 3. Clasps pop, lid swings back on its hinge.
  tl.fromTo(latches, { scaleY: 1 }, { scaleY: 0.18, duration: 0.18, ease: 'power2.in', stagger: 0.06 }, at + 1.32)
  tl.fromTo(lidClosed, { attr: { transform: hinge(1, 250) } }, { attr: { transform: hinge(0.001, 250) }, duration: 0.24, ease: 'power2.in' }, at + 1.52)
  tl.fromTo(lidOpen, { autoAlpha: 0, attr: { transform: hinge(0.001, 254) } }, { autoAlpha: 1, attr: { transform: hinge(1, 254) }, duration: 0.3, ease: 'power2.out' }, at + 1.76)

  // 4. Each cloud is drawn in, squashed through the opening and stuffed down out of sight.
  const order = [2, 0, 3, 1, 4]
  order.forEach((idx, n) => {
    const el = clouds[idx]
    const c = CLOUDS[idx]
    const t = at + 2.1 + n * 0.22
    tl.to(el, { x: MOUTH.x, y: MOUTH.y - 40, scaleX: c.s * 0.8, scaleY: c.s * 0.8, duration: 0.3, ease: EASE.inOut }, t)
    tl.to(el, { y: MOUTH.y, scaleX: 0.86, scaleY: 0.34, duration: 0.14, ease: 'power2.in' }, t + 0.3)
    tl.to(el, { y: SINK, scaleX: 0.62, scaleY: 0.26, duration: 0.12, ease: 'power1.in' }, t + 0.44)
    tl.set(el, { autoAlpha: 0 }, t + 0.56)
  })
  tl.to(before, { autoAlpha: 0, y: -8, duration: 0.3, ease: EASE.inOut }, at + 2.4)

  // 5. Lid shuts, clasps clamp, and the full case settles.
  const shut = at + 3.3
  tl.to(lidOpen, { attr: { transform: hinge(0.001, 254) }, duration: 0.2, ease: 'power2.in' }, shut)
  tl.set(lidOpen, { autoAlpha: 0 }, shut + 0.2)
  tl.to(lidClosed, { attr: { transform: hinge(1, 250) }, duration: 0.18, ease: 'power2.out' }, shut + 0.2)
  tl.to(art, { scaleX: 1.02, scaleY: 0.97, duration: 0.08, ease: 'power2.out' }, shut + 0.36)
  tl.to(art, { scaleX: 1, scaleY: 1, duration: 0.26, ease: 'back.out(3)' }, shut + 0.44)
  tl.to(latches, { scaleY: 1, duration: 0.22, ease: 'back.out(4)', stagger: 0.07 }, shut + 0.44)
  tl.fromTo(after, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.out }, shut + 0.4)

  return shut + 0.8
}

/** Final state for still pages: closed case, no clouds. */
export function settleCustody(root: HTMLElement) {
  const q = gsap.utils.selector(root)
  gsap.set(q('.cs-cloud, .cs-lid-open'), { autoAlpha: 0 })
  const [before, after] = q('.custody-note')
  gsap.set(before, { autoAlpha: 0 })
  gsap.set(after, { autoAlpha: 1 })
}

export function Custody({ reduced }: { reduced: boolean }) {
  return (
    <figure className={`custody ${reduced ? 'is-still' : ''}`} aria-label="Your memory packed into a case you carry">
      <svg className="custody-art" viewBox="0 0 640 440" aria-hidden="true">
        <defs>
          <linearGradient id="cs-cloud-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.7" stopColor="#eef4fc" />
            <stop offset="1" stopColor="#e2edf9" />
          </linearGradient>
          <linearGradient id="cs-leather" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c38c57" />
            <stop offset="1" stopColor="#a56c3c" />
          </linearGradient>
          <linearGradient id="cs-leather-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cf9a64" />
            <stop offset="1" stopColor="#b98049" />
          </linearGradient>
          <linearGradient id="cs-leather-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dcae7b" />
            <stop offset="1" stopColor="#c89360" />
          </linearGradient>
          <linearGradient id="cs-lining" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a3f2c" />
            <stop offset="1" stopColor="#2c1e15" />
          </linearGradient>
          <linearGradient id="cs-felt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b2a1e" />
            <stop offset="1" stopColor="#523a29" />
          </linearGradient>
          <linearGradient id="cs-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3f1ec" />
            <stop offset="0.5" stopColor="#c9c5bc" />
            <stop offset="1" stopColor="#9d988e" />
          </linearGradient>
          <linearGradient id="cs-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff4e4" stopOpacity="0.16" />
            <stop offset="0.38" stopColor="#fff4e4" stopOpacity="0" />
            <stop offset="0.8" stopColor="#3a2008" stopOpacity="0" />
            <stop offset="1" stopColor="#3a2008" stopOpacity="0.14" />
          </linearGradient>
          <filter id="cs-blur" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id="cs-earth-clip">
            <circle cx="304" cy="350" r="6.5" />
          </clipPath>
          <g id="cs-cloud-shape">
            <circle cx="36" cy="54" r="22" />
            <circle cx="64" cy="38" r="28" />
            <circle cx="100" cy="34" r="30" />
            <circle cx="130" cy="50" r="22" />
            <circle cx="142" cy="62" r="15" />
            <circle cx="20" cy="62" r="14" />
            <rect x="18" y="48" width="130" height="28" rx="14" />
          </g>
          <g id="cs-cloud">
            <use href="#cs-cloud-shape" fill="#b9d2ee" transform="translate(0 6)" />
            <use href="#cs-cloud-shape" fill="#d6e5f6" transform="translate(0 2.5)" />
            <use href="#cs-cloud-shape" fill="url(#cs-cloud-fill)" />
            <path d="M46 26 A28 28 0 0 1 74 12" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
            <path d="M86 14 A30 30 0 0 1 108 6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </g>
        </defs>

        <ellipse className="cs-ground" cx="320" cy="412" rx="150" ry="9" fill="rgba(24, 26, 30, 0.28)" filter="url(#cs-blur)" />

        {/* Behind the clouds: the open lid and the inside of the case. */}
        <g className="cs-case">
          <g className="cs-lid-open" visibility={reduced ? 'hidden' : undefined}>
            <rect x="196" y="110" width="248" height="150" rx="14" fill="url(#cs-leather)" />
            <rect x="207" y="121" width="226" height="132" rx="8" fill="url(#cs-felt)" />
            <rect x="220" y="190" width="200" height="56" rx="6" fill="#5b4231" />
            <path d="M226 197 H414" stroke="rgba(255, 228, 196, 0.32)" strokeWidth="1.2" strokeDasharray="4 4" />
            <rect x="196" y="110" width="248" height="5" rx="2.5" fill="rgba(255, 238, 214, 0.28)" />
          </g>
          <rect x="196" y="250" width="248" height="56" rx="9" fill="url(#cs-lining)" />
          <path d="M206 258 H434" stroke="rgba(0, 0, 0, 0.3)" strokeWidth="5" strokeLinecap="round" />
        </g>

        {!reduced &&
          CLOUDS.map((c, i) => (
            <g key={i} className="cs-cloud" style={{ visibility: 'hidden' }}>
              <g className="cs-float">
                <use href="#cs-cloud" />
              </g>
            </g>
          ))}

        {/* In front of the clouds: the body, its hardware and the closed lid. */}
        <g className="cs-case">
          <path d="M190 300 H450 V388 Q450 404 434 404 H206 Q190 404 190 388 Z" fill="url(#cs-leather)" stroke="#8d5c31" strokeWidth="1.5" />
          <path d="M190 300 H450 V388 Q450 404 434 404 H206 Q190 404 190 388 Z" fill="url(#cs-sheen)" />
          <path d="M190 300 H450 V305 H190 Z" fill="rgba(255, 236, 208, 0.22)" />
          <path d="M199 310 H441 V386 Q441 395 432 395 H208 Q199 395 199 386 Z" fill="none" stroke="rgba(255, 232, 200, 0.42)" strokeWidth="1.2" strokeDasharray="4 4" />
          <path d="M190 372 V388 Q190 404 206 404 H222 V396 Q198 396 198 372 Z" fill="#7d4f2a" />
          <path d="M450 372 V388 Q450 404 434 404 H418 V396 Q442 396 442 372 Z" fill="#7d4f2a" />
          <rect x="212" y="402" width="20" height="6" rx="3" fill="#3a2516" />
          <rect x="408" y="402" width="20" height="6" rx="3" fill="#3a2516" />
          <g className="cs-tag">
            <rect x="290" y="338" width="62" height="24" rx="5" fill="#2a2b2e" />
            <rect x="290.5" y="338.5" width="61" height="23" rx="4.5" fill="none" stroke="rgba(255, 255, 255, 0.12)" />
            <image href="/media/product/earth-mark.png" x="297.5" y="343.5" width="13" height="13" clipPath="url(#cs-earth-clip)" />
            <text x="316" y="354.5" className="cs-tag-text">
              MISSION
            </text>
          </g>
          <rect x="226" y="298" width="28" height="20" rx="4" fill="url(#cs-metal)" />
          <circle cx="240" cy="310" r="2.2" fill="#55524c" />
          <rect x="386" y="298" width="28" height="20" rx="4" fill="url(#cs-metal)" />
          <circle cx="400" cy="310" r="2.2" fill="#55524c" />
        </g>

        <g className="cs-case">
          <g className="cs-lid-closed">
            <path d="M200 262 Q200 248 214 248 H426 Q440 248 440 262 Z" fill="url(#cs-leather-top)" />
            <path d="M190 262 H450 V300 H190 Z" fill="url(#cs-leather-lid)" stroke="#8d5c31" strokeWidth="1.5" />
            <path d="M190 262 H450 V300 H190 Z" fill="url(#cs-sheen)" />
            <path d="M190 296 H450 V300 H190 Z" fill="rgba(60, 34, 14, 0.35)" />
            <path d="M199 270 H441 M199 291 H441" stroke="rgba(255, 232, 200, 0.42)" strokeWidth="1.2" strokeDasharray="4 4" />
            <rect x="282" y="242" width="14" height="10" rx="3" fill="url(#cs-metal)" />
            <rect x="344" y="242" width="14" height="10" rx="3" fill="url(#cs-metal)" />
            <path d="M289 246 V232 Q289 216 305 216 H335 Q351 216 351 232 V246" fill="none" stroke="#5e3b1f" strokeWidth="10" strokeLinecap="round" />
            <path d="M296 226 Q299 221 306 221 H334" fill="none" stroke="rgba(255, 226, 190, 0.35)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        <g className="cs-case">
          <rect className="cs-latch" x="229" y="280" width="22" height="24" rx="4" fill="url(#cs-metal)" />
          <rect className="cs-latch" x="389" y="280" width="22" height="24" rx="4" fill="url(#cs-metal)" />
        </g>
      </svg>
      <figcaption className="custody-notes">
        <span className="custody-note" aria-hidden={reduced ? true : undefined}>
          Today your memory sits on other people's clouds.
        </span>
        <span className="custody-note">Mission packs it up. It lives with you, not in a cloud.</span>
      </figcaption>
    </figure>
  )
}
