import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Aperture,
  ArrowUpRight,
  Box,
  ChevronDown,
  Columns2,
  Download,
  Grid3x3,
  Lock,
  Presentation,
  Redo2,
  Ruler,
  Save,
  Sparkles,
  Undo2,
} from 'lucide-react'
import { prefersStatic } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'
import { HOME_SLOTS, saveTeaserPlacement } from '@/landing/lib/placement'
import { setTeaserArt, setTeaserLook } from '@/landing/three/teaserArt'
import type { ArtItem } from '@/landing/three/print'

/**
 * A working slice of Mission Studio on the homepage. Finish, wordmark, initials,
 * mark style and view angle change here; everything else is shown, locked, and
 * opens the full Studio with these choices already applied.
 */

type Finish = { id: string; label: string; color: string; metalness: number; roughness: number }

// Mirrors the studio's quick-design presets (src/studio/studio/presets.ts).
const FINISHES: Finish[] = [
  { id: 'satinAluminium', label: 'Satin aluminium', color: '#c3c4c6', metalness: 1, roughness: 0.44 },
  { id: 'matteGraphite', label: 'Matte graphite', color: '#3d3f43', metalness: 0.85, roughness: 0.6 },
  { id: 'blackTitanium', label: 'Black titanium', color: '#232427', metalness: 1, roughness: 0.3 },
  { id: 'champagne', label: 'Champagne metal', color: '#d6c39f', metalness: 1, roughness: 0.32 },
  { id: 'missionBlue', label: 'Mission blue', color: '#17356f', metalness: 0.72, roughness: 0.42 },
  { id: 'matteGrey', label: 'Matte grey', color: '#8a8884', metalness: 0.9, roughness: 0.62 },
]

type MarkFinish = 'printed' | 'engraved' | 'embossed'

const LAYERS = ['Main chassis', 'Front face', 'Inner recessed panel', 'Outer perimeter', 'Chamfered edges', 'USB-C port', 'Branding', 'Surface details', 'Back face']

const STUDIO = '/studio?from=teaser'

function mix(hex: string, to: string, t: number) {
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t)
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}

/** How a mark reads on a finish: printed is near white, engraved and embossed are tones of the metal. */
function markColor(finish: Finish, style: MarkFinish) {
  if (style === 'printed') return '#f4f3ef'
  const light = luminance(finish.color) > 0.5
  if (style === 'engraved') return mix(finish.color, light ? '#2a2a2a' : '#ffffff', light ? 0.38 : 0.5)
  return mix(finish.color, '#ffffff', light ? 0.45 : 0.28)
}

const OpenStudio = createContext<() => void>(() => {})

/** A control that lives in the full Studio: shown here, locked, and opens the Studio with the current choices. */
function Locked({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const handoff = useContext(OpenStudio)
  return (
    <a className={`sp-locked ${className}`} href={STUDIO} onClick={handoff} aria-label={`${label}, opens the full Studio`}>
      {children}
      <span className="sp-lock-tip" aria-hidden="true">
        <Lock /> Full Studio
      </span>
    </a>
  )
}

export function StudioTeaser({ reduced }: { reduced: boolean }) {
  const [finishId, setFinishId] = useState('matteGraphite')
  const [word, setWord] = useState('Mission')
  const [initials, setInitials] = useState('DB')
  const [style, setStyle] = useState<MarkFinish>('engraved')
  const [view, setView] = useState<'front' | 'iso'>('front')
  const viewport = useRef<HTMLDivElement>(null)
  const finish = useMemo(() => FINISHES.find((f) => f.id === finishId) ?? FINISHES[1]!, [finishId])
  const ink = markColor(finish, style)

  useEffect(() => {
    setTeaserLook({ color: finish.color, metalness: finish.metalness, roughness: finish.roughness, view })
  }, [finish, view])

  useEffect(() => {
    const art: ArtItem[] = [
      { kind: 'word', x: HOME_SLOTS.wordmark.x / 10, y: HOME_SLOTS.wordmark.y / 10, w: 2.6, h: 0.86, text: word || ' ', color: ink },
      { kind: 'earth', x: HOME_SLOTS.earth.x / 10, y: HOME_SLOTS.earth.y / 10, w: 1.0, h: 1.0 },
      { kind: 'initials', x: HOME_SLOTS.initials.x / 10, y: HOME_SLOTS.initials.y / 10, w: 1.2, h: 0.88, text: initials || ' ', color: ink },
    ]
    setTeaserArt(art)
  }, [word, initials, ink])

  useEffect(() => {
    if (reduced || prefersStatic()) return
    let dead = false
    let root: { unmount: () => void } | null = null
    import('@/landing/three/TeaserWorld').then(({ mountTeaser }) => {
      if (dead || !viewport.current) return
      root = mountTeaser(viewport.current)
    })
    return () => {
      dead = true
      root?.unmount()
    }
  }, [reduced])

  /** Hand the current choices to the full Studio before the link navigates. */
  const handoff = () => {
    saveTeaserPlacement({
      wordmark: HOME_SLOTS.wordmark,
      earth: HOME_SLOTS.earth,
      initials: HOME_SLOTS.initials,
      features: [],
      finish: finish.id,
      wordmarkText: word.trim() || 'Mission',
      initialsText: initials.trim(),
      markFinish: style,
    })
  }

  return (
    <OpenStudio.Provider value={handoff}>
    <section className="teaser sp" id="design" aria-labelledby="teaser-title">
      <header className="sp-head">
        <p className="eyebrow" data-reveal>
          <i /> Studio preview
        </p>
        <h2 id="teaser-title" data-split>
          Design your card.
        </h2>
        <p className="teaser-sub" data-reveal>
          Choose a finish and make the marks yours here. Placement, hardware modules and renders open in the full Studio, with your choices carried across.
        </p>
      </header>

      <div className="sp-window" data-reveal>
        <div className="sp-bar">
          <div className="sp-brand">
            <Box aria-hidden="true" />
            <b>Mission</b>
            <span>Studio</span>
          </div>
          <span className="sp-doc">Mission / Concept 001</span>
          <span className="sp-undo" aria-hidden="true">
            <Undo2 />
            <Redo2 />
          </span>
          <span className="sp-status">
            <i /> Live preview
          </span>
          <div className="sp-tools">
            <Locked label="Save">
              <Save /> Save
            </Locked>
            <Locked label="Export">
              <Download /> Export
            </Locked>
            <Locked label="Present">
              <Presentation /> Present
            </Locked>
            <Locked label="Render">
              <Aperture /> Render
            </Locked>
          </div>
          <a className="sp-open" href={STUDIO} onClick={handoff} data-testid="link-teaser-studio-primary">
            Open full Studio <ArrowUpRight aria-hidden="true" />
          </a>
        </div>

        <div className="sp-body">
          <aside className="sp-layers" aria-label="Layers, available in the full Studio">
            <p className="sp-k">Layers</p>
            <p className="sp-title">Mission / {finish.label.split(' ').slice(-1)[0]}</p>
            <Locked label="Mission card layers" className="sp-tree-head">
              <ChevronDown /> Mission card <em>12</em>
            </Locked>
            <ul className="sp-tree">
              {LAYERS.map((l) => (
                <li key={l}>
                  <Locked label={l}>{l}</Locked>
                </li>
              ))}
            </ul>
            <p className="sp-foot">Select, rename and lock layers in the full Studio.</p>
          </aside>

          <div className="sp-stage">
            <div className="sp-toolbar">
              <div className="sp-seg" aria-hidden="true">
                <span className="is-on">Persp</span>
                <span>Ortho</span>
              </div>
              <div className="sp-seg" role="group" aria-label="View">
                <button type="button" className={view === 'front' ? 'is-on' : ''} aria-pressed={view === 'front'} onClick={() => setView('front')}>
                  Front
                </button>
                <button type="button" className={view === 'iso' ? 'is-on' : ''} aria-pressed={view === 'iso'} onClick={() => setView('iso')}>
                  Iso
                </button>
                <Locked label="Back, Right and Top views" className="sp-seg-more">
                  Back · Right · Top
                </Locked>
              </div>
              <div className="sp-seg sp-seg-icons">
                <span className="is-on">True colour</span>
                <Locked label="Grid">
                  <Grid3x3 />
                </Locked>
                <Locked label="Measure">
                  <Ruler />
                </Locked>
                <Locked label="Effects">
                  <Sparkles />
                </Locked>
                <Locked label="Compare">
                  <Columns2 />
                </Locked>
              </div>
            </div>
            <div className="sp-viewport">
              {reduced ? <CardFace alt="Mission card" /> : <div className="sp-view" ref={viewport} aria-label={`${finish.label} card with ${word || 'no'} wordmark`} role="img" />}
            </div>
            <div className="sp-meta">
              <span>86 × 55 × 4.4 mm · Persp · {view === 'front' ? 'Front' : 'Iso'} · True colour</span>
              <span>Orbit, pan and zoom in the full Studio</span>
            </div>
          </div>

          <aside className="sp-panel" aria-label="Quick design">
            <div className="sp-tabs">
              <span className="is-on">Quick design</span>
              <Locked label="Advanced settings">Advanced</Locked>
            </div>
            <p className="sp-hint">Finish and marks. Everything here carries into the full Studio.</p>

            <p className="sp-k">Finish</p>
            <div className="sp-swatches" role="radiogroup" aria-label="Finish">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={f.id === finishId}
                  className={`sp-swatch ${f.id === finishId ? 'is-on' : ''}`}
                  onClick={() => setFinishId(f.id)}
                  data-testid={`button-teaser-finish-${f.id}`}
                >
                  <span style={{ background: `linear-gradient(140deg, ${mix(f.color, '#ffffff', 0.28)}, ${f.color} 55%, ${mix(f.color, '#000000', 0.32)})` }} />
                  {f.label}
                </button>
              ))}
            </div>

            <p className="sp-k">Wordmark</p>
            <label className="sp-field">
              <span>Text</span>
              <input value={word} maxLength={14} onChange={(e) => setWord(e.target.value)} spellCheck={false} data-testid="input-teaser-wordmark" />
            </label>
            <label className="sp-field">
              <span>Initials</span>
              <input value={initials} maxLength={3} onChange={(e) => setInitials(e.target.value.toUpperCase())} spellCheck={false} data-testid="input-teaser-initials" />
            </label>
            <div className="sp-seg sp-seg-full" role="radiogroup" aria-label="Mark finish">
              {(['printed', 'engraved', 'embossed'] as MarkFinish[]).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={style === s} className={style === s ? 'is-on' : ''} onClick={() => setStyle(s)}>
                  {s[0]!.toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <Locked label="Hardware modules" className="sp-modules">
              <span>
                <b>Hardware modules</b>
                NFC, location, microphone, haptics and more, placed on the card.
              </span>
            </Locked>

            <a className="btn btn-ink sp-cta" href={STUDIO} onClick={handoff} data-testid="link-teaser-studio">
              Continue in the full Studio <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
      </div>

      <p className="est-fine sp-fine">
        Founding target £249 for the base card. Hardware modules are concept options, not prices or an offer. We’re not taking orders.
      </p>
    </section>
    </OpenStudio.Provider>
  )
}
