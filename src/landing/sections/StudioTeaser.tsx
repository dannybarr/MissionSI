import { useRef, useState } from 'react'
import { CardFace } from '@/landing/components/CardFace'
import { HOME_SLOTS, saveTeaserPlacement, type TeaserPlacement } from '@/landing/lib/placement'
import { Magnetic } from '@/landing/components/Magnetic'

type ChipId = keyof TeaserPlacement

const CHIPS: { id: ChipId; label: string; start: { x: number; y: number } }[] = [
  { id: 'wordmark', label: 'Mission', start: { x: -18, y: -8 } },
  { id: 'earth', label: 'Earth', start: { x: 18, y: -36 } },
  { id: 'initials', label: 'DB', start: { x: 22, y: 34 } },
]

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function StudioTeaser() {
  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Record<ChipId, { x: number; y: number; snapped: boolean }>>({
    wordmark: { ...CHIPS[0].start, snapped: false },
    earth: { ...CHIPS[1].start, snapped: false },
    initials: { ...CHIPS[2].start, snapped: false },
  })
  const drag = useRef<{ id: ChipId; dx: number; dy: number } | null>(null)

  const toMm = (clientX: number, clientY: number) => {
    const r = card.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    const x = ((clientX - (r.left + r.width / 2)) / r.width) * 86
    const y = -((clientY - (r.top + r.height / 2)) / r.height) * 54
    return { x: clamp(x, -38, 38), y: clamp(y, -22, 22) }
  }

  const snapIfClose = (id: ChipId, mm: { x: number; y: number }) => {
    const home = HOME_SLOTS[id]
    const near = Math.hypot(mm.x - home.x, mm.y - home.y) < 10
    return near ? { ...home, snapped: true } : { ...mm, snapped: false }
  }

  const onPointerDown = (id: ChipId, e: React.PointerEvent) => {
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const cur = pos[id]
    drag.current = { id, dx: e.clientX - (r.left + r.width / 2 + (cur.x / 100) * r.width), dy: e.clientY - (r.top + r.height / 2 + (cur.y / 100) * r.height) }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    const r = stage.current?.getBoundingClientRect()
    if (!d || !r) return
    const x = ((e.clientX - d.dx - (r.left + r.width / 2)) / r.width) * 100
    const y = ((e.clientY - d.dy - (r.top + r.height / 2)) / r.height) * 100
    setPos((p) => ({ ...p, [d.id]: { x: clamp(x, -46, 46), y: clamp(y, -46, 46), snapped: false } }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const mm = toMm(e.clientX, e.clientY)
    const next = snapIfClose(d.id, mm)
    if (next.snapped) {
      const r = stage.current?.getBoundingClientRect()
      const cr = card.current?.getBoundingClientRect()
      if (r && cr) {
        const px = ((next.x / 86) * cr.width) / r.width * 100
        const py = ((-next.y / 54) * cr.height) / r.height * 100
        setPos((p) => ({ ...p, [d.id]: { x: px, y: py, snapped: true } }))
        if (navigator.vibrate) navigator.vibrate(12)
        return
      }
    }
    setPos((p) => ({ ...p, [d.id]: { ...p[d.id], snapped: false } }))
  }

  const nudge = (id: ChipId, key: string) => {
    const step = 4
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[key]
    if (!delta) return
    setPos((p) => ({
      ...p,
      [id]: { x: clamp(p[id].x + delta[0], -46, 46), y: clamp(p[id].y + delta[1], -46, 46), snapped: false },
    }))
  }

  const placement = (): TeaserPlacement => {
    const r = stage.current?.getBoundingClientRect()
    const cr = card.current?.getBoundingClientRect()
    const out = {} as TeaserPlacement
    for (const id of ['wordmark', 'earth', 'initials'] as ChipId[]) {
      if (pos[id].snapped) {
        out[id] = { ...HOME_SLOTS[id] }
        continue
      }
      if (!r || !cr) {
        out[id] = { ...HOME_SLOTS[id] }
        continue
      }
      const cx = r.left + r.width / 2 + (pos[id].x / 100) * r.width
      const cy = r.top + r.height / 2 + (pos[id].y / 100) * r.height
      out[id] = toMm(cx, cy)
    }
    return out
  }

  const go = () => {
    saveTeaserPlacement(placement())
  }

  return (
    <section className="teaser" id="design">
      <div className="teaser-copy">
        <p className="eyebrow">Studio</p>
        <h2>Drag onto your card.</h2>
        <p>Place the Earth, the wordmark and your initials. They spring into place. Studio opens with that layout.</p>
      </div>
      <div
        className="teaser-stage"
        ref={stage}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="teaser-card" ref={card}>
          <CardFace marks={false} alt="Blank Mission card, ready for your marks" />
          {CHIPS.map((c) => (
            <span key={c.id} className={`slot ${pos[c.id].snapped ? 'filled' : ''}`} data-slot={c.id} aria-hidden="true">
              {c.label}
            </span>
          ))}
        </div>
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${pos[c.id].snapped ? 'snapped' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${pos[c.id].x}%, ${pos[c.id].y}%)` }}
            onPointerDown={(e) => onPointerDown(c.id, e)}
            onKeyDown={(e) => {
              if (e.key.startsWith('Arrow')) {
                e.preventDefault()
                nudge(c.id, e.key)
              }
            }}
            aria-label={`Drag the ${c.label} onto the card. Arrow keys nudge it.`}
          >
            {c.id === 'earth' ? <img src="/assets/nasa/earth.webp" alt="" draggable={false} /> : c.label}
          </button>
        ))}
      </div>
      <Magnetic>
        <a className="btn btn-ink" href="/studio?from=teaser" onClick={go}>
          Design and reserve yours <span aria-hidden="true">→</span>
        </a>
      </Magnetic>
    </section>
  )
}
