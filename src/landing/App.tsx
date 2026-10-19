import '@/landing/index.css'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useLandingScroll } from '@/landing/lib/smooth'
import { useReveals } from '@/landing/lib/reveal'
import { Opening } from '@/landing/sections/Opening'
import { Tray } from '@/landing/sections/Tray'
import { Statement } from '@/landing/sections/Statement'
import { Flags } from '@/landing/sections/Flags'
import { Forest } from '@/landing/sections/Forest'
import { HowItWorks } from '@/landing/sections/HowItWorks'
import { StudioTeaser } from '@/landing/sections/StudioTeaser'
import { PlugSequence } from '@/landing/sections/PlugSequence'
import { Faq } from '@/landing/sections/Faq'
import { Close, Footer } from '@/landing/sections/Close'
import { OpenCard } from '@/landing/sections/OpenCard'
import { Captures } from '@/landing/sections/Captures'

const LINKS = [
  ['inside', 'Inside'],
  ['captures', 'Captures'],
  ['how', 'How it works'],
  ['agents', 'Agents'],
  ['faq', 'Questions'],
]

function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => {
      setSolid(window.scrollY > 12)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`site-nav ${solid ? 'solid' : ''}`}>
      <a href="#top" className="wordmark">
        <img src="/media/product/earth-mark.png" alt="" width={34} height={34} />
        <span>Mission</span>
      </a>
      <nav aria-label="Page">
        {LINKS.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>
      <a className="nav-cta" href="/studio">
        Design and reserve yours
      </a>
      <button type="button" className="nav-menu" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
        Menu
      </button>
      {open && (
        <div id="mobile-nav" className="mobile-nav">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a href="/studio" onClick={() => setOpen(false)}>
            Design and reserve yours
          </a>
        </div>
      )}
    </header>
  )
}

/** The soft sheen in the grain layer trails the pointer, eased so it drifts rather than snaps. */
function useGrainLight(reduced: boolean) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.site-grain')
    if (!el || reduced || !window.matchMedia('(pointer: fine)').matches) return
    let x = window.innerWidth / 2
    let y = window.innerHeight * 0.3
    let tx = x
    let ty = y
    let raf = 0
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.setProperty('--mx', `${x.toFixed(1)}px`)
      el.style.setProperty('--my', `${y.toFixed(1)}px`)
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0
    }
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduced])
}

export default function LandingApp() {
  const [reduced, setReduced] = useState(false)
  // Layout, not passive: ScrollTrigger pins wrap sections, and a later passive
  // update then makes React insert against a node GSAP moved. Resolve reduced
  // motion before those effects run.
  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const q = new URLSearchParams(window.location.search).has('reduced')
    const apply = () => setReduced(mq.matches || q)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  useLandingScroll(reduced)
  useReveals(reduced)
  useGrainLight(reduced)

  return (
    <div className={`mission-site ${reduced ? 'reduced' : ''}`}>
      <div className="site-grain" data-site-texture="true" aria-hidden="true">
        <div className="site-grain-mottle" />
        <div className="site-grain-wash" />
        <div className="site-grain-dark" />
        <div className="site-grain-light" />
      </div>
      <a className="skip" href="#top">
        Skip to content
      </a>
      <Nav />
      <main>
        <Opening reduced={reduced} />
        {reduced && <Tray reduced />}
        <Statement reduced={reduced} />
        <Flags reduced={reduced} />
        <OpenCard reduced={reduced} />
        <Captures reduced={reduced} />
        <Forest reduced={reduced} />
        <HowItWorks reduced={reduced} />
        <StudioTeaser reduced={reduced} />
        <PlugSequence reduced={reduced} />
        <Faq reduced={reduced} />
        <Close />
      </main>
      <Footer />
    </div>
  )
}
