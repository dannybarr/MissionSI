import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { gsap } from '@/landing/lib/motion'
import { Bluetooth, CircleDot, Cpu, MapPin, Mic, Nfc, Plus, Vibrate, X } from 'lucide-react'
import { CardFace } from '@/landing/components/CardFace'
import { Magnetic } from '@/landing/components/Magnetic'
import { HOME_SLOTS, saveTeaserPlacement, type IdentityId, type TeaserPlacement, type XY } from '@/landing/lib/placement'
import { setTeaserArt } from '@/landing/three/teaserArt'
import type { ArtItem } from '@/landing/three/print'
import { CARD_MM, FEATURE_BY_ID, FEATURES, indicativeTotal, type FeatureId } from '@/shared/card-features'

type ItemId = IdentityId | FeatureId

interface KitItem {
  id: ItemId
  kind: 'identity' | 'feature'
  label: string
  hint: string
  w: number
  h: number
  home: XY
}

const IDENTITY: KitItem[] = [
  { id: 'earth', kind: 'identity', label: 'Earth', hint: 'NASA’s Blue Marble, printed in full colour.', w: 11.2, h: 11.2, home: HOME_SLOTS.earth },
  { id: 'wordmark', kind: 'identity', label: 'Mission', hint: 'The wordmark, upper left.', w: 22, h: 4.6, home: HOME_SLOTS.wordmark },
  { id: 'initials', kind: 'identity', label: 'DB', hint: 'Your initials, lower right.', w: 12, h: 5.8, home: HOME_SLOTS.initials },
]

const HARDWARE: KitItem[] = FEATURES.map((f) => ({ id: f.id, kind: 'feature', label: f.short, hint: f.benefit, w: f.w, h: f.h, home: f.home }))

const ALL: KitItem[] = [...IDENTITY, ...HARDWARE]
const BY_ID = Object.fromEntries(ALL.map((i) => [i.id, i])) as Record<ItemId, KitItem>

const ICONS: Record<FeatureId, ReactNode> = {
  nfc: <Nfc />,
  gps: <MapPin />,
  mic: <Mic />,
  haptics: <Vibrate />,
  secure: <Cpu />,
  bluetooth: <Bluetooth />,
  status: <CircleDot />,
}

const SNAP_MM = 9
const MAGNET_MM = 6
const LONG_PRESS_MS = 140

const isFeature = (id: ItemId): id is FeatureId => id in FEATURE_BY_ID

/** Random, non-overlapping spots around the card, as a percentage of the stage. */
function scatterSpots(ids: string[]) {
  const spots: Record<string, { left: string; top: string }> = {}
  const taken: { x: number; y: number }[] = []
  for (const id of ids) {
    let x = 50
    let y = 50
    for (let n = 0; n < 48; n++) {
      x = 10 + Math.random() * 80
      y = 8 + Math.random() * 84
      const onCard = Math.abs(x - 50) < 30 && Math.abs(y - 48) < 26
      const crowded = taken.some((p) => Math.hypot(p.x - x, p.y - y) < 16)
      if (!onCard && !crowded) break
    }
    taken.push({ x, y })
    spots[id] = { left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%` }
  }
  return spots
}

function clampItem(item: KitItem, p: XY): XY {
  const mx = CARD_MM.w / 2 - 4.5 - item.w / 2
  const my = CARD_MM.h / 2 - 4 - item.h / 2
  const r = (v: number) => Math.round(v * 2) / 2
  return { x: r(Math.max(-mx, Math.min(mx, p.x))), y: r(Math.max(-my, Math.min(my, p.y))) }
}

const pct = (p: XY) => ({ left: `${50 + (p.x / CARD_MM.w) * 100}%`, top: `${50 - (p.y / CARD_MM.h) * 100}%` })
const size = (i: KitItem) => ({ width: `${(i.w / CARD_MM.w) * 100}%`, height: `${(i.h / CARD_MM.h) * 100}%` })

interface Drag {
  id: ItemId
  from: 'kit' | 'card'
  pointerId: number
  pointerType: string
  startX: number
  startY: number
  /** pointer offset inside the grabbed element */
  ox: number
  oy: number
  x: number
  y: number
  lastX: number
  rot: number
  active: boolean
  over: boolean
  snapTo: ItemId | null
  timer: number
}

interface Flip {
  id: ItemId
  cx: number
  cy: number
  rot: number
  scale: number
}

export function StudioTeaser({ reduced }: { reduced: boolean }) {
  const [placed, setPlaced] = useState<Partial<Record<ItemId, XY>>>({})
  const [spots, setSpots] = useState<Record<string, { left: string; top: string }> | null>(null)
  useEffect(() => {
    setSpots(scatterSpots(ALL.map((item) => item.id)))
  }, [])
  const view = useRef<HTMLDivElement>(null)
  const [dragId, setDragId] = useState<ItemId | null>(null)
  const [tip, setTip] = useState<ItemId | null>(null)
  const [announce, setAnnounce] = useState('')
  const card = useRef<HTMLDivElement>(null)
  const cardBody = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const ripple = useRef<HTMLSpanElement>(null)
  const drag = useRef<Drag | null>(null)
  const flip = useRef<Flip | null>(null)
  const raf = useRef(0)
  const tipTimer = useRef(0)
  const nodes = useRef(new Map<ItemId, HTMLElement>())
  const tokens = useRef(new Map<ItemId, HTMLElement>())

  const features = useMemo(() => HARDWARE.filter((h) => placed[h.id]).map((h) => h.id as FeatureId), [placed])
  const total = indicativeTotal(features)

  useEffect(() => {
    const art: ArtItem[] = []
    for (const item of ALL) {
      const p = placed[item.id]
      if (!p) continue
      const x = p.x / 10
      const y = p.y / 10
      if (item.id === 'wordmark') art.push({ kind: 'word', x, y, w: item.w / 10, h: item.h / 10, text: 'Mission' })
      else if (item.id === 'initials') art.push({ kind: 'initials', x, y, w: item.w / 10, h: item.h / 10, text: 'DB' })
      else if (item.id === 'earth') art.push({ kind: 'earth', x, y, w: item.w / 10, h: item.h / 10 })
      else if (isFeature(item.id)) art.push({ kind: 'etch', x, y, w: item.w / 10, h: item.h / 10, svg: FEATURE_BY_ID[item.id].svg })
    }
    setTeaserArt(art)
  }, [placed])

  useEffect(() => {
    if (reduced) return
    let dead = false
    let root: { unmount: () => void } | null = null
    import('@/landing/three/TeaserWorld').then(({ mountTeaser }) => {
      if (dead || !view.current) return
      root = mountTeaser(view.current)
    })
    return () => {
      dead = true
      root?.unmount()
    }
  }, [reduced])

  const flashTip = useCallback((id: ItemId) => {
    window.clearTimeout(tipTimer.current)
    setTip(id)
    tipTimer.current = window.setTimeout(() => setTip((t) => (t === id ? null : t)), 2600)
  }, [])

  const toMm = (clientX: number, clientY: number): XY | null => {
    const r = card.current?.getBoundingClientRect()
    if (!r) return null
    return { x: ((clientX - r.left) / r.width - 0.5) * CARD_MM.w, y: -((clientY - r.top) / r.height - 0.5) * CARD_MM.h }
  }

  const overCard = (clientX: number, clientY: number) => {
    const r = card.current?.getBoundingClientRect()
    if (!r) return false
    const pad = Math.min(24, r.width * 0.03)
    return clientX > r.left - pad && clientX < r.right + pad && clientY > r.top - pad && clientY < r.bottom + pad
  }

  /** Where a drop at this pointer would land, after snapping. */
  const resolveDrop = (id: ItemId, d: Drag, clientX: number, clientY: number): { at: XY; snapped: boolean } | null => {
    const r = card.current?.getBoundingClientRect()
    const item = BY_ID[id]
    if (!r) return null
    // centre of the grabbed thing, not the fingertip
    const cx = clientX - d.ox
    const cy = clientY - d.oy
    const mm = toMm(cx, cy)
    if (!mm) return null
    const near = Math.hypot(mm.x - item.home.x, mm.y - item.home.y)
    if (item.kind === 'identity' && near < SNAP_MM) return { at: item.home, snapped: true }
    if (item.kind === 'feature' && near < MAGNET_MM) return { at: item.home, snapped: true }
    return { at: clampItem(item, mm), snapped: false }
  }

  const thunk = useCallback(
    (clientX: number, clientY: number) => {
      if (navigator.vibrate) navigator.vibrate(10)
      if (reduced) return
      const r = card.current?.getBoundingClientRect()
      const body = cardBody.current
      if (body) gsap.fromTo(body, { scale: 0.986 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.38)', overwrite: true })
      const rp = ripple.current
      if (rp && r) {
        gsap.set(rp, { left: clientX - r.left, top: clientY - r.top })
        gsap.fromTo(rp, { scale: 0.2, opacity: 0.55 }, { scale: 2.6, opacity: 0, duration: 0.8, ease: 'expo.out', overwrite: true })
      }
    },
    [reduced],
  )

  const place = useCallback(
    (id: ItemId, at: XY, from: Flip | null, label: 'added' | 'moved') => {
      flip.current = from
      setPlaced((p) => ({ ...p, [id]: at }))
      const item = BY_ID[id]
      if (label === 'added') setAnnounce(`${item.kind === 'feature' ? FEATURE_BY_ID[id as FeatureId].label : item.label} added. ${item.hint}`)
      if (isFeature(id)) flashTip(id)
    },
    [flashTip],
  )

  const remove = useCallback(
    (id: ItemId) => {
      const el = nodes.current.get(id)
      const token = tokens.current.get(id)
      const done = () => {
        setPlaced((p) => {
          const n = { ...p }
          delete n[id]
          return n
        })
        setTip((t) => (t === id ? null : t))
        if (token && !reduced) gsap.fromTo(token, { scale: 1.12 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
      }
      const item = BY_ID[id]
      setAnnounce(`${item.kind === 'feature' ? FEATURE_BY_ID[id as FeatureId].label : item.label} removed.`)
      if (!el || reduced) return done()
      gsap.to(el, { scale: 0.55, opacity: 0, y: '-=10', duration: 0.32, ease: 'power2.in', onComplete: done })
    },
    [reduced],
  )

  // FLIP: spring a freshly placed element from wherever the pointer released it.
  useLayoutEffect(() => {
    const f = flip.current
    if (!f) return
    flip.current = null
    const el = nodes.current.get(f.id)
    if (!el) return
    gsap.killTweensOf(el)
    if (reduced) {
      gsap.set(el, { clearProps: 'transform,opacity' })
      return
    }
    const r = el.getBoundingClientRect()
    const dx = f.cx - (r.left + r.width / 2)
    const dy = f.cy - (r.top + r.height / 2)
    gsap.fromTo(
      el,
      { x: dx, y: dy, rotation: f.rot, scale: f.scale, opacity: 1 },
      { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.95, ease: 'elastic.out(1, 0.52)', clearProps: 'transform' },
    )
  }, [placed, reduced])

  /* ---------------- dragging ---------------- */

  const ghostPos = useRef({ x: 0, y: 0, rot: 0, scale: 1, opacity: 1 })

  const writeGhost = useCallback(() => {
    const g = ghost.current
    const p = ghostPos.current
    if (!g) return
    g.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${p.rot.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`
    g.style.opacity = String(p.opacity)
  }, [])

  const paintGhost = useCallback(() => {
    raf.current = 0
    const d = drag.current
    if (!d) return
    const p = ghostPos.current
    const vx = d.x - d.lastX
    d.lastX = d.x
    const target = Math.max(-14, Math.min(14, vx * 0.9))
    d.rot += (target - d.rot) * 0.2
    const scaleTarget = d.over ? 0.94 : 1.06
    p.x = d.x - d.ox
    p.y = d.y - d.oy
    p.rot = d.rot
    p.scale += (scaleTarget - p.scale) * 0.25
    p.opacity = 1
    writeGhost()
    if (Math.abs(d.rot) > 0.05 || Math.abs(target) > 0.05 || Math.abs(scaleTarget - p.scale) > 0.002) raf.current = requestAnimationFrame(paintGhost)
  }, [writeGhost])

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paintGhost)
  }, [paintGhost])

  const setReceiving = (on: boolean, snapTo: ItemId | null) => {
    const c = card.current
    if (!c) return
    c.classList.toggle('is-receiving', on)
    c.querySelectorAll<HTMLElement>('[data-slot]').forEach((s) => s.classList.toggle('is-hot', s.dataset.slot === snapTo))
  }

  const blockScroll = useCallback((e: TouchEvent) => {
    if (drag.current?.active) e.preventDefault()
  }, [])

  const begin = (d: Drag) => {
    d.active = true
    window.addEventListener('touchmove', blockScroll, { passive: false })
    if (d.from === 'card') {
      const el = nodes.current.get(d.id)
      if (el) gsap.to(el, { opacity: 0, scale: 0.9, duration: 0.18, ease: 'power2.out' })
    }
    setDragId(d.id)
    setTip(null)
    document.documentElement.classList.add('is-dragging')
  }

  const end = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('touchmove', blockScroll)
    document.documentElement.classList.remove('is-dragging')
    setReceiving(false, null)
  }

  const onMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    d.x = e.clientX
    d.y = e.clientY
    if (!d.active) {
      const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY)
      if (d.pointerType === 'touch' && d.from === 'kit') {
        // a swipe before the long-press is a page scroll
        if (moved > 10) {
          window.clearTimeout(d.timer)
          drag.current = null
          end()
        }
        return
      }
      if (moved < 4) return
      window.clearTimeout(d.timer)
      begin(d)
    }
    const over = overCard(e.clientX, e.clientY)
    const res = over ? resolveDrop(d.id, d, e.clientX, e.clientY) : null
    const snapTo = res?.snapped && BY_ID[d.id].kind === 'identity' ? d.id : null
    if (over !== d.over || snapTo !== d.snapTo) {
      d.over = over
      d.snapTo = snapTo
      setReceiving(over, snapTo)
    }
    schedule()
  }

  const finish = (e: PointerEvent, cancelled: boolean) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    drag.current = null
    window.clearTimeout(d.timer)
    end()
    if (!d.active) {
      // a tap: on the card it reveals the benefit, in the kit it does nothing (Add is the button)
      if (d.from === 'card' && !cancelled) flashTip(d.id)
      return
    }
    const g = ghost.current
    const gr = g?.getBoundingClientRect()
    const from: Flip | null = gr ? { id: d.id, cx: gr.left + gr.width / 2, cy: gr.top + gr.height / 2, rot: d.rot, scale: 1.08 } : null
    const over = !cancelled && overCard(e.clientX, e.clientY)
    if (over) {
      const res = resolveDrop(d.id, d, e.clientX, e.clientY)
      setDragId(null)
      if (res) {
        place(d.id, res.at, from, d.from === 'kit' ? 'added' : 'moved')
        thunk(from?.cx ?? e.clientX, from?.cy ?? e.clientY)
      }
      return
    }
    if (d.from === 'card') {
      setDragId(null)
      if (cancelled) {
        const el = nodes.current.get(d.id)
        if (el) gsap.to(el, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' })
      } else remove(d.id)
      return
    }
    // dropped outside: glide back to the kit token
    const token = tokens.current.get(d.id)?.querySelector('.token')
    const tr = token?.getBoundingClientRect()
    cancelAnimationFrame(raf.current)
    raf.current = 0
    if (!g || !tr || reduced) {
      setDragId(null)
      return
    }
    gsap.to(ghostPos.current, {
      x: tr.left + tr.width / 2,
      y: tr.top + tr.height / 2,
      rot: 0,
      scale: 1,
      opacity: 0.2,
      duration: 0.5,
      ease: 'expo.out',
      onUpdate: writeGhost,
      onComplete: () => setDragId(null),
    })
  }

  const onUp = (e: PointerEvent) => finish(e, false)
  const onCancel = (e: PointerEvent) => finish(e, true)

  const startDrag = (id: ItemId, from: 'kit' | 'card', e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || drag.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const d: Drag = {
      id,
      from,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      ox: e.clientX - (r.left + r.width / 2),
      oy: e.clientY - (r.top + r.height / 2),
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      rot: 0,
      active: false,
      over: false,
      snapTo: null,
      timer: 0,
    }
    // the ghost is a chip; grab it by its centre when lifting from the card
    if (from === 'card') {
      d.ox = 0
      d.oy = 0
    }
    drag.current = d
    if (e.pointerType === 'touch' && from === 'kit') {
      d.timer = window.setTimeout(() => {
        if (drag.current === d && !d.active) {
          begin(d)
          if (navigator.vibrate) navigator.vibrate(6)
          schedule()
        }
      }, LONG_PRESS_MS)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      window.clearTimeout(tipTimer.current)
      window.removeEventListener('touchmove', blockScroll)
      document.documentElement.classList.remove('is-dragging')
    },
    [blockScroll],
  )

  useLayoutEffect(() => {
    const d = drag.current
    if (dragId && d) {
      gsap.killTweensOf(ghostPos.current)
      Object.assign(ghostPos.current, { x: d.x - d.ox, y: d.y - d.oy, rot: 0, scale: 1, opacity: 1 })
      writeGhost()
      schedule()
    }
  }, [dragId, schedule, writeGhost])

  /* ---------------- keyboard ---------------- */

  const addFromKit = (id: ItemId) => {
    if (placed[id]) return remove(id)
    const token = tokens.current.get(id)
    const tr = token?.getBoundingClientRect()
    place(id, BY_ID[id].home, tr ? { id, cx: tr.left + tr.width / 2, cy: tr.top + tr.height / 2, rot: -6, scale: 1.1 } : null, 'added')
    const cr = card.current?.getBoundingClientRect()
    if (cr) {
      const h = BY_ID[id].home
      thunk(cr.left + (0.5 + h.x / CARD_MM.w) * cr.width, cr.top + (0.5 - h.y / CARD_MM.h) * cr.height)
    }
  }

  const onPlacedKey = (id: ItemId, e: ReactKeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 5 : 1
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    if (delta[e.key]) {
      e.preventDefault()
      const cur = placed[id]
      if (!cur) return
      const next = clampItem(BY_ID[id], { x: cur.x + delta[e.key][0], y: cur.y + delta[e.key][1] })
      setPlaced((p) => ({ ...p, [id]: next }))
      setAnnounce(`${BY_ID[id].label} at ${next.x} by ${next.y} millimetres.`)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      remove(id)
      tokens.current.get(id)?.querySelector<HTMLButtonElement>('.kit-add')?.focus()
    }
  }

  const reset = () => {
    for (const id of Object.keys(placed) as ItemId[]) remove(id)
  }

  const save = () => {
    const out: TeaserPlacement = { features: [] }
    for (const i of IDENTITY) {
      const p = placed[i.id]
      if (p) out[i.id as IdentityId] = p
    }
    for (const h of HARDWARE) {
      const p = placed[h.id]
      if (p) out.features!.push({ id: h.id as FeatureId, ...p })
    }
    if (Object.keys(placed).length) saveTeaserPlacement(out)
  }

  const count = Object.keys(placed).length
  const dragItem = dragId ? BY_ID[dragId] : null

  return (
    <section className="teaser" id="design" aria-labelledby="teaser-title">
      <header className="teaser-head">
        <p className="eyebrow" data-reveal>
          <i /> Studio preview
        </p>
        <h2 id="teaser-title" data-split>
          Drag onto your card.
        </h2>
        <p className="teaser-sub" data-reveal>
          Place the Earth, the wordmark and your initials. Then add hardware modules and see what each one is for. Studio opens with exactly this layout.
        </p>
      </header>

      <div className="teaser-stage">
          <div className="teaser-mat" aria-hidden="true" />
          <div className="teaser-card" ref={card} role="group" aria-label={`Your card. ${count ? `${count} item${count > 1 ? 's' : ''} placed.` : 'Nothing placed yet.'}`}>
            <div className="teaser-card-body" ref={cardBody}>
              {reduced ? (
                <CardFace marks={false} ring={false} alt="Blank Mission card, ready for your marks" />
              ) : (
                <div className="teaser-view" ref={view} />
              )}
              <div className="teaser-layer">
                {IDENTITY.map((i) =>
                  placed[i.id] ? null : (
                    <span key={i.id} className="slot" data-slot={i.id} style={{ ...pct(i.home), ...size(i) }} aria-hidden="true">
                      <span>{i.label}</span>
                    </span>
                  ),
                )}
                {ALL.map((item) => {
                  const p = placed[item.id]
                  if (!p) return null
                  const feature = isFeature(item.id) ? FEATURE_BY_ID[item.id] : null
                  return (
                    <button
                      key={item.id}
                      type="button"
                      ref={(el) => {
                        if (el) nodes.current.set(item.id, el)
                        else nodes.current.delete(item.id)
                      }}
                      className={`placed placed-${item.id} ${tip === item.id ? 'show-tip' : ''} ${reduced ? '' : 'is-printed'}`}
                      style={{ ...pct(p), ...size(item) }}
                      onPointerDown={(e) => startDrag(item.id, 'card', e)}
                      onKeyDown={(e) => onPlacedKey(item.id, e)}
                      onFocus={() => setTip(item.id)}
                      onBlur={() => setTip((t) => (t === item.id ? null : t))}
                      onMouseEnter={() => setTip(item.id)}
                      onMouseLeave={() => setTip((t) => (t === item.id ? null : t))}
                      aria-label={`${feature ? feature.label : item.label} on the card. ${item.hint} Arrow keys move it, Delete removes it, or drag it off the card.`}
                      aria-describedby={`tip-${item.id}`}
                    >
                      {item.id === 'earth' && <img src="/assets/nasa/earth-240.webp" alt="" draggable={false} />}
                      {item.id === 'wordmark' && <span className="pw">Mission</span>}
                      {item.id === 'initials' && <span className="pi">DB</span>}
                      {feature && <span className="pf" dangerouslySetInnerHTML={{ __html: feature.svg }} />}
                      <span className="tip" role="tooltip" id={`tip-${item.id}`}>
                        <b>{feature ? feature.short : item.label}</b> {item.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <span className="drop-ripple" ref={ripple} aria-hidden="true" />
          </div>
          <ul className="scatter" aria-label="Pieces you can place">
            {spots && ALL.map((item) => (
              <KitRow
                key={item.id}
                item={item}
                placed={!!placed[item.id]}
                dragging={dragId === item.id}
                style={spots[item.id]}
                tokenRef={(el) => (el ? tokens.current.set(item.id, el) : tokens.current.delete(item.id))}
                onPointerDown={(e) => !placed[item.id] && startDrag(item.id, 'kit', e)}
                onAdd={() => addFromKit(item.id)}
              />
            ))}
          </ul>
          <p className="stage-hint" aria-hidden="true">
            {count ? 'Drag a piece off the card to remove it.' : 'Drag a piece onto the card, or use Add.'}
          </p>
        </div>

        <div className="kit-summary teaser-below">
            <div className="kit-summary-head">
              <h3>On your card</h3>
              {count > 0 && (
                <button type="button" className="kit-reset" onClick={reset}>
                  Clear
                </button>
              )}
            </div>
            {features.length ? (
              <ul className="feature-list">
                {features.map((id) => (
                  <li key={id}>
                    <span className="fl-icon" aria-hidden="true">
                      {ICONS[id]}
                    </span>
                    <span className="fl-text">
                      <b>{FEATURE_BY_ID[id].label}</b>
                      <span>{FEATURE_BY_ID[id].benefit}</span>
                    </span>
                    <button type="button" className="fl-remove" onClick={() => remove(id)} aria-label={`Remove ${FEATURE_BY_ID[id].label}`}>
                      <X />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feature-empty">No hardware modules yet. The base card holds your memory, encrypted.</p>
            )}
            {features.length > 0 && (
              <p className="est" data-testid="text-indicative-price">
                <span>Est. add-ons, indicative only</span>
                <b>+£{total}</b>
              </p>
            )}
            <p className="est-fine">
              Founding target £249 for the base card. Module figures are rough concept estimates, not prices, quotes or an offer. We’re not taking orders.
            </p>
            <Magnetic className="kit-cta-wrap">
              <a className="btn btn-ink kit-cta" href="/studio?from=teaser" onClick={save} data-testid="link-teaser-studio">
                Design and reserve yours <span aria-hidden="true">→</span>
              </a>
            </Magnetic>
        </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {dragItem && (
        <div className={`ghost ghost-${dragItem.kind}`} ref={ghost} aria-hidden="true">
          <Token item={dragItem} />
        </div>
      )}
    </section>
  )
}

function Token({ item }: { item: KitItem }) {
  return (
    <span className={`token token-${item.kind}`}>
      <span className="token-icon">
        {item.id === 'earth' ? (
          <img src="/assets/nasa/earth-240.webp" alt="" draggable={false} />
        ) : item.id === 'wordmark' ? (
          <span className="token-glyph">M</span>
        ) : item.id === 'initials' ? (
          <span className="token-glyph">DB</span>
        ) : (
          ICONS[item.id as FeatureId]
        )}
      </span>
      <span className="token-label">{item.label}</span>
    </span>
  )
}

function KitRow({
  item,
  placed,
  dragging,
  tokenRef,
  onPointerDown,
  onAdd,
  style,
}: {
  item: KitItem
  placed: boolean
  dragging: boolean
  tokenRef: (el: HTMLElement | null) => void
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  onAdd: () => void
  style?: { left: string; top: string }
}) {
  const name = item.kind === 'feature' ? FEATURE_BY_ID[item.id as FeatureId].label : item.label
  return (
    <li className={`kit-row ${placed ? 'is-placed' : ''} ${dragging ? 'is-lifted' : ''}`} ref={tokenRef} style={style}>
      <span className="kit-handle" onPointerDown={onPointerDown} onContextMenu={(e) => e.preventDefault()} aria-hidden="true">
        <Token item={item} />
      </span>
      <span className="kit-hint">{item.hint}</span>
      <button type="button" className="kit-add" onClick={onAdd} aria-pressed={placed} aria-label={placed ? `Remove ${name} from the card` : `Add ${name} to the card`}>
        {placed ? (
          <>
            <X aria-hidden="true" /> Remove
          </>
        ) : (
          <>
            <Plus aria-hidden="true" /> Add
          </>
        )}
      </button>
    </li>
  )
}
