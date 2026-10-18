import '@/landing/index.css'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useLandingScroll } from '@/landing/lib/smooth'
import { useReveals } from '@/landing/lib/reveal'
import { Opening } from '@/landing/sections/Opening'
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
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    let travel = 0
    const on = () => {
      const y = window.scrollY
      const dy = y - last
      last = y
      setSolid(y > 12)
      // accumulate a little travel first so trackpad jitter doesn't flicker the bar
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy
      if (y < 120) setHidden(false)
      else if (travel > 36) setHidden(true)
      else if (travel < -24) setHidden(false)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`site-nav ${solid ? 'solid' : ''} ${hidden && !open ? 'is-hidden' : ''}`} onFocus={() => setHidden(false)}>
      <a href="#top" className="wordmark">
        Mission
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

  return (
    <div className={`mission-site ${reduced ? 'reduced' : ''}`}>
      <div className="site-grain" data-site-texture="true" aria-hidden="true">
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
