import { useEffect, useRef, useState } from 'react'
import { gsap, prefersStatic } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'
import { Magnetic } from '@/landing/components/Magnetic'
import { pose, signals } from '@/landing/three/pose'
import { phase, productMotion } from '@/landing/three/productMotion'
import { Hero } from './Hero'

export function Opening({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const trayCopy = useRef<HTMLDivElement>(null)
  const meta = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reduced || prefersStatic()) return
    const el = section.current
    const pinned = pin.current
    const view = track.current
    const copyEl = copy.current
    const trayEl = trayCopy.current
    if (!el || !pinned || !view || !copyEl || !trayEl) return

    Object.assign(pose, productMotion(0))
    pose.tiltX = 0
    pose.tiltY = 0
    pose.cam = 0
    pose.settle = 0
    pose.nudge = 0
    pose.spinning = 0
    signals.onReady = () => setReady(true)

    let dead = false
    let unregister = () => {}
    let release = () => {}
    const stageP = import('@/landing/three/stage')
    const worldP = import('@/landing/three/OpeningWorld')
    Promise.all([stageP, worldP]).then(async ([stage, world]) => {
      if (dead || !track.current) return
      await stage.acquireStage()
      if (dead || !track.current) {
        stage.releaseStage()
        return
      }
      release = () => stage.releaseStage()
      unregister = stage.registerView('opening', track.current, <world.OpeningScene />)
      stage.setViewActive('opening', true)
    }).catch(() => {
      // Keep the static product and ordinary page flow usable if WebGL fails.
      if (!dead) el.classList.add('opening-unavailable')
    })

    const io = new IntersectionObserver(
      ([entry]) => {
        stageP.then((stage) => stage.setViewActive('opening', !!entry?.isIntersecting))
      },
      { rootMargin: '240px' },
    )
    io.observe(view)

    const progress = { value: 0 }
    const render = () => {
      const next = productMotion(progress.value)
      Object.assign(pose, next)
      copyEl.style.opacity = String(next.copy)
      // Preserve the CSS centring translate on desktop and the top-aligned mobile layout.
      // Copy drops away and softens as the card grows down into its space.
      copyEl.style.transform = `translateY(${(1 - next.copy) * 70}px)`
      copyEl.style.filter = next.copy < 1 ? `blur(${((1 - next.copy) * 6).toFixed(2)}px)` : ''
      copyEl.inert = next.copy < 0.05
      if (meta.current) meta.current.style.opacity = String(Math.max(0, next.copy * 1.6 - 0.6))
      trayEl.style.opacity = String(next.trayCopy)
      trayEl.style.translate = `0 ${(1 - next.trayCopy) * 12}px`
      view.style.opacity = '1'
      el.style.setProperty('--connection-caption', String(next.connection))
      document.documentElement.style.setProperty('--connect-dark', String(phase(progress.value, 0.32, 0.37) * (1 - phase(progress.value, 0.64, 0.71))))
      pose.inspection = phase(progress.value, 0.24, 0.4)
      el.style.setProperty('--inspection', String(pose.inspection))
    }
    const ctx = gsap.context(() => {
      gsap.to(progress, {
        value: 1,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${window.innerHeight * (window.innerWidth < 760 ? 3.2 : 3.8)}`,
        pin: pinned,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        },
      })
    }, el)

    let tiltOff = () => {}
    if (window.matchMedia('(pointer: fine)').matches) {
      const maxY = (3 * Math.PI) / 180
      const maxX = (2 * Math.PI) / 180
      const qy = gsap.quickTo(pose, 'tiltY', { duration: 0.6, ease: 'power3.out' })
      const qx = gsap.quickTo(pose, 'tiltX', { duration: 0.6, ease: 'power3.out' })
      const onMove = (e: PointerEvent) => {
        if (progress.value > 0.06) {
          qx(0)
          qy(0)
          return
        }
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        // Inverted: the card leans away from the cursor.
        qy(Math.max(-maxY, Math.min(maxY, -nx * maxY * 2)))
        qx(Math.max(-maxX, Math.min(maxX, ny * maxX * 2)))
      }
      const onLeave = () => {
        qx(0)
        qy(0)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      tiltOff = () => {
        window.removeEventListener('pointermove', onMove)
        document.documentElement.removeEventListener('pointerleave', onLeave)
      }
    }

    return () => {
      dead = true
      tiltOff()
      io.disconnect()
      ctx.revert()
      gsap.killTweensOf(pose)
      unregister()
      release()
      signals.onReady = () => {}
      document.documentElement.style.removeProperty('--connect-dark')
    }
  }, [reduced])

  if (reduced) {
    return <Hero reduced />
  }

  return (
    <section className={`opening ${ready ? 'is-ready' : ''}`} id="top" ref={section}>
      <div className="opening-pin" ref={pin}>
        <div className="opening-view" ref={track} />
        <p className="opening-connection-caption">A physical connection.<br /><span>Your memory, within reach.</span></p>
        <div className="opening-copy" ref={copy}>
          <p className="eyebrow" data-testid="status-prototype" data-reveal data-reveal-now data-delay="0.15">
            <i />
            In development · not taking orders
          </p>
          <h1 data-split="now" data-delay="0.25">
            A personal AI memory, encrypted on a card <em className="sheen">you own.</em>
          </h1>
          <p className="lede" data-reveal data-reveal-now data-delay="0.7">
            Plug it in and every AI knows you. Unplug it and their access ends.
          </p>
          <div className="hero-actions" data-reveal="stagger" data-reveal-now data-delay="0.85">
            <Magnetic>
              <a className="btn btn-ink" href="/studio" data-testid="link-hero-studio">
                Design and reserve yours <span aria-hidden="true">→</span>
              </a>
            </Magnetic>
            <a className="btn btn-line" href="#how" data-testid="link-hero-how">
              See how it works
            </a>
          </div>
        </div>
        <div className="opening-meta" ref={meta}>
          <ul className="hero-specs" aria-label="Concept card">
            <li>
              <b>86 × 55 mm</b> graphite
            </li>
            <li>
              <b>USB-C</b> port
            </li>
            <li>
              <b>Status</b> light
            </li>
            <li className="hero-specs-note">Concept · not manufactured</li>
          </ul>
          <span className="scroll-cue" aria-hidden="true">
            Scroll <i />
          </span>
        </div>
        <div className="opening-tray-copy" ref={trayCopy}>
          <p className="eyebrow">
            <i /> Everyday carry
          </p>
          <h2>It lives with the things you already take.</h2>
          <p>The card belongs beside the things you already carry. Connect it when you choose; put it away when you’re done.</p>
        </div>
        <div className="opening-fallback" aria-hidden="true">
          <CardFace className="hero-card" />
        </div>
      </div>
    </section>
  )
}
