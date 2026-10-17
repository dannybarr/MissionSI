import { useEffect, useState } from 'react'
import { useLandingScroll } from '@/landing/lib/smooth'
import { Hero } from '@/landing/sections/Hero'
import { Statement } from '@/landing/sections/Statement'
import { Flags } from '@/landing/sections/Flags'
import { Forest } from '@/landing/sections/Forest'
import { HowItWorks } from '@/landing/sections/HowItWorks'
import { StudioTeaser } from '@/landing/sections/StudioTeaser'
import { PlugSequence } from '@/landing/sections/PlugSequence'
import { Tray } from '@/landing/sections/Tray'
import { Faq } from '@/landing/sections/Faq'
import { Close, Footer } from '@/landing/sections/Close'

const LINKS = [
  ['how', 'How it works'],
  ['agents', 'Agents'],
  ['faq', 'Questions'],
]

function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`site-nav ${solid ? 'solid' : ''}`}>
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
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const q = new URLSearchParams(window.location.search).has('reduced')
    const apply = () => setReduced(mq.matches || q)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  useLandingScroll(reduced)

  return (
    <div className={`mission-site ${reduced ? 'reduced' : ''}`}>
      <a className="skip" href="#top">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero reduced={reduced} />
        <Statement reduced={reduced} />
        <Flags reduced={reduced} />
        <Forest reduced={reduced} />
        <HowItWorks reduced={reduced} />
        <StudioTeaser reduced={reduced} />
        <PlugSequence reduced={reduced} />
        <Tray reduced={reduced} />
        <Faq />
        <Close />
      </main>
      <Footer />
    </div>
  )
}
