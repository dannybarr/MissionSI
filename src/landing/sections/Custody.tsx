import { EASE, gsap, ScrollTrigger } from '@/landing/lib/motion'
import './custody.css'

type Kind = 'health' | 'ideas' | 'money' | 'people' | 'places'

/** Where each cloud floats before it is packed: top-left of its 160 x 84 box, plus scale. Each holds one part of a life. */
const CLOUDS: { x: number; y: number; s: number; from: number; kind: Kind; label: string }[] = [
  { x: 30, y: 30, s: 1.06, from: -1, kind: 'health', label: 'Health' },
  { x: 444, y: 10, s: 1.14, from: 1, kind: 'ideas', label: 'Ideas' },
  { x: 240, y: 70, s: 0.84, from: -1, kind: 'money', label: 'Money' },
  { x: 492, y: 136, s: 0.78, from: 1, kind: 'people', label: 'Relationships' },
  { x: -6, y: 150, s: 0.72, from: -1, kind: 'places', label: 'Places' },
]

/**
 * Case geometry, in viewBox units. Every shape is drawn from these edges so the lid,
 * body and hardware meet exactly. Corner radii share one family: 14 outside, 8 inside.
 */
const L = 168
const R = 472
const TOP = 236 // far edge of the lid's top face
const LID = 252 // where the top face meets the lid front
const SEAM = 292 // lid front meets body
const BASE = 404 // bottom of the body
const FLOOR = 409 // underside of the feet
const HINGE = 246 // the lid's back hinge, as seen from the front
const CLASPS = [222, 418]
const LATCH_PIVOT = 298

/**
 * The case is drawn at its original size and scaled up as a whole about the middle of its feet,
 * so every edge keeps lining up. Clouds live outside that scale, so their targets are converted.
 */
const GROW = 1.2
const SIZE = `matrix(${GROW} 0 0 ${GROW} ${320 * (1 - GROW)} ${FLOOR * (1 - GROW)})`
const onCase = (y: number) => FLOOR + GROW * (y - FLOOR)

/** Centre of the case opening. A cloud box is 160 x 84, scaled about its centre. */
const MOUTH = { x: 320 - 80, y: onCase(268) - 46 }
const SINK = onCase(340) - 46

/** A vertical squash about a horizontal line at y, as a plain SVG matrix so it scrubs cleanly to near zero. */
const hinge = (s: number, y: number) => `matrix(1 0 0 ${s} 0 ${(y * (1 - s)).toFixed(3)})`
/** A horizontal stretch about the case's centre line, for the ground shadow. */
const spread = (s: number) => `matrix(${s} 0 0 1 ${(320 * (1 - s)).toFixed(3)} 0)`

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
  const [latchL, latchR] = q('.cs-latch')
  const contact = q('.cs-contact')
  const ambient = q('.cs-ambient')
  const [before, after] = q('.custody-note')

  // Independent idle drift, on an inner group so the scrubbed timeline owns the outer transform.
  const drift = floats.map((el, i) =>
    gsap.to(el, { y: i % 2 ? 7 : -7, x: i % 2 ? -4 : 5, duration: 2.6 + i * 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 }),
  )
  // Drift and the icon loops only run while the section is on screen.
  const figure = root.querySelector('.custody')
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: ({ isActive }) => {
      figure?.classList.toggle('is-live', isActive)
      drift.forEach((t) => (isActive ? t.resume() : t.pause()))
    },
  })
  drift.forEach((t) => t.pause())

  // The case is four layers (clouds pass between them), so one pose drives all four as a single matrix,
  // pivoting on the middle of its feet. Tilt is in degrees.
  const pose = { y: 0, tilt: 0, sx: 1, sy: 1 }
  const place = () => {
    const r = (pose.tilt * Math.PI) / 180
    const a = Math.cos(r) * pose.sx
    const b = Math.sin(r) * pose.sx
    const c = -Math.sin(r) * pose.sy
    const d = Math.cos(r) * pose.sy
    const e = 320 - a * 320 - c * FLOOR
    const f = FLOOR + pose.y - b * 320 - d * FLOOR
    const m = `matrix(${a.toFixed(5)} ${b.toFixed(5)} ${c.toFixed(5)} ${d.toFixed(5)} ${e.toFixed(3)} ${f.toFixed(3)})`
    caseParts.forEach((el) => el.setAttribute('transform', m))
  }
  const move = (vars: gsap.TweenVars, t: number) => tl.to(pose, { ...vars, onUpdate: place }, t)

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

  // 2. The case drops in with some weight, lands slightly tilted and rocks level.
  const land = at + 0.7
  tl.fromTo(pose, { y: -70, tilt: -2, sx: 1, sy: 1 }, { y: 0, tilt: 1.4, duration: 0.42, ease: 'power2.in', onUpdate: place, immediateRender: true }, land)
  tl.fromTo(caseParts, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, ease: 'none' }, land)
  tl.fromTo(contact, { autoAlpha: 0, attr: { transform: spread(0.55) } }, { autoAlpha: 1, attr: { transform: spread(1) }, duration: 0.42, ease: 'power2.in' }, land)
  tl.fromTo(ambient, { autoAlpha: 0, attr: { transform: spread(1.3) } }, { autoAlpha: 1, attr: { transform: spread(1) }, duration: 0.42, ease: 'power1.in' }, land)
  move({ sx: 1.018, sy: 0.975, tilt: -0.6, duration: 0.07, ease: 'power2.out' }, land + 0.42)
  move({ sx: 1, sy: 1, tilt: 0, duration: 0.3, ease: 'back.out(2.2)' }, land + 0.49)

  // 3. Clasps pop open on their lower hinges, then the lid swings back on its rear hinge.
  const open = at + 1.36
  tl.fromTo(latchL, { attr: { transform: hinge(1, LATCH_PIVOT) } }, { attr: { transform: hinge(0.2, LATCH_PIVOT) }, duration: 0.1, ease: 'back.out(2.6)' }, open)
  tl.fromTo(latchR, { attr: { transform: hinge(1, LATCH_PIVOT) } }, { attr: { transform: hinge(0.2, LATCH_PIVOT) }, duration: 0.1, ease: 'back.out(2.6)' }, open + 0.06)
  tl.fromTo(lidClosed, { attr: { transform: hinge(1, HINGE) } }, { attr: { transform: hinge(0.001, HINGE) }, duration: 0.2, ease: 'power1.in' }, open + 0.2)
  tl.fromTo(
    lidOpen,
    { attr: { transform: hinge(0.001, HINGE) } },
    { attr: { transform: hinge(1, HINGE) }, duration: 0.34, ease: 'power3.out' },
    open + 0.4,
  )

  // 4. Each cloud is drawn in, squashed through the opening and stuffed down out of sight.
  //    The case gives a little as each one lands inside.
  const order = [2, 0, 3, 1, 4]
  order.forEach((idx, n) => {
    const el = clouds[idx]
    const c = CLOUDS[idx]
    const t = at + 2.1 + n * 0.22
    tl.to(el, { x: MOUTH.x, y: MOUTH.y - 46, scaleX: c.s * 0.84, scaleY: c.s * 0.84, duration: 0.3, ease: EASE.inOut }, t)
    tl.to(el, { y: MOUTH.y, scaleX: 0.9, scaleY: 0.36, duration: 0.14, ease: 'power2.in' }, t + 0.3)
    tl.to(el, { y: SINK, scaleX: 0.66, scaleY: 0.26, duration: 0.12, ease: 'power1.in' }, t + 0.44)
    tl.set(el, { autoAlpha: 0 }, t + 0.56)
    move({ sx: 1.01, sy: 0.984, duration: 0.05, ease: 'power2.out' }, t + 0.48)
    move({ sx: 1, sy: 1, duration: 0.14, ease: 'back.out(3)' }, t + 0.53)
  })
  tl.to(before, { autoAlpha: 0, y: -8, duration: 0.3, ease: EASE.inOut }, at + 2.4)

  // 5. The lid accelerates shut, the case takes the impact, then the clasps snap down left, right.
  const shut = at + 3.3
  tl.to(lidOpen, { attr: { transform: hinge(0.001, HINGE) }, duration: 0.2, ease: 'power3.in' }, shut)
  tl.set(lidOpen, { autoAlpha: 0 }, shut + 0.2)
  tl.to(lidClosed, { attr: { transform: hinge(1, HINGE) }, duration: 0.1, ease: 'power2.in' }, shut + 0.2)
  move({ sx: 1.022, sy: 0.968, duration: 0.05, ease: 'power2.out' }, shut + 0.3)
  move({ sx: 1, sy: 1, duration: 0.26, ease: 'back.out(3)' }, shut + 0.35)
  tl.to(latchL, { attr: { transform: hinge(1, LATCH_PIVOT) }, duration: 0.1, ease: 'back.out(3.5)' }, shut + 0.42)
  tl.to(latchR, { attr: { transform: hinge(1, LATCH_PIVOT) }, duration: 0.1, ease: 'back.out(3.5)' }, shut + 0.48)
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

/** Outline of the body front: square top on the seam, 14 radius at the bottom corners. */
const BODY = `M${L} ${SEAM} H${R} V${BASE - 14} Q${R} ${BASE} ${R - 14} ${BASE} H${L + 14} Q${L} ${BASE} ${L} ${BASE - 14} Z`
/** Stitching, inset 10 from the body edges with a concentric corner. */
const BODY_STITCH = `M${L + 10} ${SEAM + 12} H${R - 10} V${BASE - 16} Q${R - 10} ${BASE - 10} ${R - 16} ${BASE - 10} H${L + 16} Q${L + 10} ${BASE - 10} ${L + 10} ${BASE - 16} Z`
/** The lid's top face: the same width as the front, rounded at its far corners. */
const LID_TOP = `M${L} ${LID} V${TOP + 10} Q${L} ${TOP} ${L + 10} ${TOP} H${R - 10} Q${R} ${TOP} ${R} ${TOP + 10} V${LID} Z`
const LID_FRONT = `M${L} ${LID} H${R} V${SEAM} H${L} Z`
/** Corner caps follow the body corner: outer radius 14, inner radius 8. */
const capL = `M${L} ${BASE - 30} V${BASE - 14} Q${L} ${BASE} ${L + 14} ${BASE} H${L + 30} V${BASE - 6} H${L + 14} Q${L + 6} ${BASE - 6} ${L + 6} ${BASE - 14} V${BASE - 30} Z`
const capR = `M${R} ${BASE - 30} V${BASE - 14} Q${R} ${BASE} ${R - 14} ${BASE} H${R - 30} V${BASE - 6} H${R - 14} Q${R - 6} ${BASE - 6} ${R - 6} ${BASE - 14} V${BASE - 30} Z`
/** The inside of the lid, standing up from the hinge. Bottom edge tucks under the rim. */
const LID_OPEN = `M${L} 252 V96 Q${L} 82 ${L + 14} 82 H${R - 14} Q${R} 82 ${R} 96 V252 Z`
const LID_FELT = `M${L + 10} 252 V100 Q${L + 10} 92 ${L + 18} 92 H${R - 18} Q${R - 10} 92 ${R - 10} 100 V252 Z`
const LINING = `M${L + 4} ${SEAM + 6} V${HINGE + 4} Q${L + 4} ${HINGE - 4} ${L + 12} ${HINGE - 4} H${R - 12} Q${R - 4} ${HINGE - 4} ${R - 4} ${HINGE + 4} V${SEAM + 6} Z`
const EARTH = { cx: 320, cy: 350, r: 15 }

/**
 * One small drawing per cloud, centred on the cloud's body and about 30% of its height.
 * Drawn in a 26-unit box around the origin, in the cloud's own deeper underside blue.
 */
function CloudIcon({ kind }: { kind: Kind }) {
  return (
    <g className={`cs-icon cs-icon-${kind}`} transform="translate(82 50)" aria-hidden="true">
      {kind === 'health' && (
        <>
          <path d="M0 10 C-12 3 -13 -6 -6.5 -9.5 C-3.4 -11 -1 -9.6 0 -7 C1 -9.6 3.4 -11 6.5 -9.5 C13 -6 12 3 0 10 Z" className="cs-icon-soft" />
          <path d="M-8 -0.5 H-4.2 L-2.2 -4.6 L0.8 3.6 L2.8 -0.5 H8" className="cs-pulse" pathLength={1} />
        </>
      )}
      {kind === 'ideas' && (
        <>
          <circle r="11" cy="-4" className="cs-glow" />
          <path d="M-3.6 5 C-3.6 2 -8 0 -8 -5 A8 8 0 1 1 8 -5 C8 0 3.6 2 3.6 5 Z" className="cs-icon-soft" />
          <path d="M-3.4 8.4 H3.4 M-2 11.4 H2 M-1.6 -1 L0 -4 L1.6 -1" />
        </>
      )}
      {kind === 'money' && (
        <g className="cs-coin">
          <circle r="10.5" className="cs-icon-soft" />
          <circle r="7.6" className="cs-icon-faint" />
          <path d="M2.8 -3.6 C2.3 -5.6 -2.4 -5.8 -2.4 -2 V4.2 M-4.4 0.2 H1.2 M-4.4 4.2 H3.8" />
        </g>
      )}
      {kind === 'people' && (
        <>
          <g className="cs-lean-l">
            <circle cx="-5.5" cy="-5" r="3.4" />
            <path d="M-11 9.5 C-11 3 -9 0.5 -5.5 0.5 C-2 0.5 0 3 0 9.5" />
          </g>
          <g className="cs-lean-r">
            <circle cx="5.5" cy="-5" r="3.4" />
            <path d="M0 9.5 C0 3 2 0.5 5.5 0.5 C9 0.5 11 3 11 9.5" />
          </g>
        </>
      )}
      {kind === 'places' && (
        <>
          <ellipse cy="11" rx="5" ry="1.2" className="cs-icon-faint cs-pin-shadow" />
          <g className="cs-pin">
            <path d="M0 9.5 C-1.5 7.6 -8 1.6 -8 -3.5 A8 8 0 1 1 8 -3.5 C8 1.6 1.5 7.6 0 9.5 Z" className="cs-icon-soft" />
            <circle cy="-3.6" r="2.8" />
          </g>
        </>
      )}
    </g>
  )
}

export function Custody({ reduced }: { reduced: boolean }) {
  return (
    <figure className={`custody ${reduced ? 'is-still' : ''}`} aria-label="Your memory packed into a case you carry">
      <svg className="custody-art" viewBox="0 0 640 440" role="group" aria-label="Memories in other people's clouds, packed into a case you carry">
        <defs>
          <linearGradient id="cs-cloud-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.7" stopColor="#eef4fc" />
            <stop offset="1" stopColor="#e2edf9" />
          </linearGradient>
          {/* Leather, lit from the top left: warm on top, deepening toward the lower edge. */}
          <linearGradient id="cs-leather" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0" stopColor="#c99460" />
            <stop offset="0.62" stopColor="#b47a46" />
            <stop offset="1" stopColor="#9a6336" />
          </linearGradient>
          <linearGradient id="cs-leather-lid" x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0" stopColor="#d4a16b" />
            <stop offset="1" stopColor="#bf8650" />
          </linearGradient>
          <linearGradient id="cs-leather-top" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#dcb07e" />
            <stop offset="1" stopColor="#d09d69" />
          </linearGradient>
          <linearGradient id="cs-leather-open" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#c48d59" />
            <stop offset="1" stopColor="#a56d3d" />
          </linearGradient>
          <linearGradient id="cs-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff4e4" stopOpacity="0.14" />
            <stop offset="0.4" stopColor="#fff4e4" stopOpacity="0" />
            <stop offset="0.78" stopColor="#3a2008" stopOpacity="0" />
            <stop offset="1" stopColor="#3a2008" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="cs-seam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b1f0a" stopOpacity="0.32" />
            <stop offset="1" stopColor="#3b1f0a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cs-lining" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b402d" />
            <stop offset="1" stopColor="#2a1c13" />
          </linearGradient>
          <linearGradient id="cs-felt" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#4a3424" />
            <stop offset="1" stopColor="#36261a" />
          </linearGradient>
          <linearGradient id="cs-metal" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#ecebe7" />
            <stop offset="1" stopColor="#a7a39b" />
          </linearGradient>
          <linearGradient id="cs-handle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6e4626" />
            <stop offset="1" stopColor="#4f3119" />
          </linearGradient>
          <radialGradient id="cs-glass" cx="0.32" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
          </radialGradient>
          <filter id="cs-blur-wide" x="-30%" y="-300%" width="160%" height="700%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="cs-blur-tight" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <clipPath id="cs-earth-clip">
            <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} />
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

        {/* Contact shadow: a wide soft pool and a tight dark line under the feet. */}
        <g transform={SIZE} aria-hidden="true">
          <ellipse className="cs-ambient" cx="324" cy={FLOOR - 1} rx="176" ry="10" fill="rgba(28, 30, 36, 0.2)" filter="url(#cs-blur-wide)" />
          <ellipse className="cs-contact" cx="322" cy={FLOOR} rx="148" ry="3.2" fill="rgba(22, 16, 10, 0.42)" filter="url(#cs-blur-tight)" />
        </g>

        {/* Behind the clouds: the open lid and the inside of the case. */}
        <g transform={SIZE} aria-hidden="true">
          <g className="cs-case">
            <g className="cs-lid-open" visibility={reduced ? 'hidden' : undefined}>
              <path d={LID_OPEN} fill="url(#cs-leather-open)" />
              <path d={LID_FELT} fill="url(#cs-felt)" />
              <path d={`M${L + 24} 186 H${R - 24} V244 H${L + 24} Z`} fill="#523a29" />
              <path d={`M${L + 30} 194 H${R - 30}`} stroke="rgba(255, 228, 196, 0.26)" strokeWidth="1" strokeDasharray="4 4" />
              <path d={`M${L + 14} 82.5 H${R - 14}`} stroke="rgba(255, 240, 220, 0.4)" strokeWidth="1" />
            </g>
            <path d={LINING} fill="url(#cs-lining)" />
            <path d={`M${L + 4} ${HINGE + 6} H${R - 4} V${HINGE + 14} H${L + 4} Z`} fill="rgba(0, 0, 0, 0.18)" />
          </g>
        </g>

        {!reduced &&
          CLOUDS.map((c, i) => (
            <g key={i} className="cs-cloud" style={{ visibility: 'hidden' }} role="img" aria-label={c.label}>
              <title>{c.label}</title>
              <g className="cs-float">
                <use href="#cs-cloud" />
                <CloudIcon kind={c.kind} />
              </g>
            </g>
          ))}

        {/* In front of the clouds: feet, body and its hardware. */}
        <g transform={SIZE} aria-hidden="true">
          <g className="cs-case">
            <rect x={L + 26} y={BASE - 6} width="24" height={FLOOR - BASE + 6} rx="3.5" fill="#3d2717" />
            <rect x={R - 50} y={BASE - 6} width="24" height={FLOOR - BASE + 6} rx="3.5" fill="#3d2717" />
            <path d={BODY} fill="url(#cs-leather)" />
            <path d={BODY} fill="url(#cs-sheen)" />
            <path d={`M${L} ${SEAM} H${R} V${SEAM + 9} H${L} Z`} fill="url(#cs-seam)" />
            <path d={BODY_STITCH} fill="none" stroke="rgba(255, 232, 200, 0.36)" strokeWidth="1" strokeDasharray="4 3.5" />
            <path d={capL} fill="#87552d" />
            <path d={capR} fill="#7b4c27" />
            {CLASPS.map((x) => (
              <g key={x}>
                <rect x={x - 15} y={SEAM + 2} width="30" height="20" rx="4" fill="url(#cs-metal)" />
                <path d={`M${x - 11} ${SEAM + 2.5} H${x + 11}`} stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1" />
                <rect x={x - 2.5} y={SEAM + 12} width="5" height="5" rx="1.2" fill="#5d5952" />
              </g>
            ))}
            <g className="cs-badge">
              <circle cx={EARTH.cx} cy={EARTH.cy + 0.8} r={EARTH.r + 2.6} fill="rgba(40, 20, 6, 0.3)" />
              <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r + 2.2} fill="#26272a" />
              <image
                href="/assets/nasa/earth-240.webp"
                x={EARTH.cx - EARTH.r}
                y={EARTH.cy - EARTH.r}
                width={EARTH.r * 2}
                height={EARTH.r * 2}
                clipPath="url(#cs-earth-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill="url(#cs-glass)" />
              <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r + 1.1} fill="none" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="0.8" />
              <ellipse cx={EARTH.cx - 5.5} cy={EARTH.cy - 7.5} rx="4.2" ry="1.8" transform={`rotate(-32 ${EARTH.cx - 5.5} ${EARTH.cy - 7.5})`} fill="rgba(255, 255, 255, 0.6)" />
            </g>
          </g>
        </g>

        {/* The closed lid: top face, front band and handle. */}
        <g transform={SIZE} aria-hidden="true">
          <g className="cs-case">
            <g className="cs-lid-closed">
              <path d={LID_TOP} fill="url(#cs-leather-top)" />
              <path d={LID_FRONT} fill="url(#cs-leather-lid)" />
              <path d={LID_FRONT} fill="url(#cs-sheen)" />
              <path d={`M${L} ${LID} H${R}`} stroke="rgba(255, 240, 220, 0.45)" strokeWidth="1" />
              <path d={`M${L} ${SEAM - 4} H${R} V${SEAM} H${L} Z`} fill="rgba(60, 32, 12, 0.22)" />
              <path d={`M${L + 10} ${LID + 8} H${R - 10} M${L + 10} ${SEAM - 10} H${R - 10}`} stroke="rgba(255, 232, 200, 0.36)" strokeWidth="1" strokeDasharray="4 3.5" />
              <rect x="271" y={TOP - 6} width="18" height="10" rx="3" fill="url(#cs-metal)" />
              <rect x="351" y={TOP - 6} width="18" height="10" rx="3" fill="url(#cs-metal)" />
              <path d={`M280 ${TOP - 2} V222 Q280 204 298 204 H342 Q360 204 360 222 V${TOP - 2}`} fill="none" stroke="url(#cs-handle)" strokeWidth="11" strokeLinecap="round" />
              <path d="M287 216 Q291 210 299 210 H340" fill="none" stroke="rgba(255, 226, 190, 0.3)" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* Clasp latches hook from the body plates up onto the lid. */}
        <g transform={SIZE} aria-hidden="true">
          <g className="cs-case">
            {CLASPS.map((x) => (
              <g key={x} className="cs-latch">
                <rect x={x - 12} y={SEAM - 20} width="24" height={LATCH_PIVOT - SEAM + 20} rx="4" fill="url(#cs-metal)" />
                <path d={`M${x - 8} ${SEAM - 19.5} H${x + 8}`} stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1" />
                <path d={`M${x - 7} ${SEAM - 3} H${x + 7}`} stroke="rgba(70, 66, 60, 0.35)" strokeWidth="1" />
              </g>
            ))}
          </g>
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
