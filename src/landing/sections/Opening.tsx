import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'
import { Magnetic } from '@/landing/components/Magnetic'
import { pose, signals } from '@/landing/three/pose'
import { Hero } from './Hero'
import { Tray } from './Tray'

const TURN = (1260 * Math.PI) / 180

function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

export function Opening({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const trayCopy = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reduced) return
    const el = section.current
    const pinned = pin.current
    const view = track.current
    const copyEl = copy.current
    const trayEl = trayCopy.current
    if (!el || !pinned || !view || !copyEl || !trayEl) return

    pose.spin = Math.PI
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
    stageP.then(async (stage) => {
      const world = await worldP
      if (dead || !track.current) return
      await stage.acquireStage()
      if (dead || !track.current) {
        stage.releaseStage()
        return
      }
      release = () => stage.releaseStage()
      unregister = stage.registerView('opening', track.current, <world.OpeningScene />)
      stage.setViewActive('opening', true)
    })

    const io = new IntersectionObserver(
      ([entry]) => {
        stageP.then((stage) => stage.setViewActive('opening', !!entry?.isIntersecting))
      },
      { rootMargin: '240px' },
    )
    io.observe(view)

    let facingFront = false
    let sprung = false
    const spinTo = (front: boolean) => {
      pose.spinning = 1
      gsap.to(pose, { tiltX: 0, tiltY: 0, duration: 0.35, overwrite: 'auto' })
      gsap.to(pose, {
        spin: front ? Math.PI + TURN : Math.PI,
        duration: 1.5,
        ease: 'expo.out',
        overwrite: 'auto',
        onComplete: () => {
          pose.spinning = 0
        },
      })
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=280%',
        pin: pinned,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const p = self.progress
          const wantFront = p > 0.045
          if (wantFront !== facingFront) {
            facingFront = wantFront
            spinTo(wantFront)
          }
          const travel = smooth(Math.max(0, Math.min(1, (p - 0.16) / 0.74)))
          pose.cam = travel
          const fade = smooth(Math.max(0, Math.min(1, (travel - 0.04) / 0.2)))
          copyEl.style.opacity = String(1 - fade)
          copyEl.style.translate = `0 ${-fade * 28}px`
          const trayIn = smooth(Math.max(0, Math.min(1, (travel - 0.52) / 0.22)))
          trayEl.style.opacity = String(trayIn)
          trayEl.style.translate = `0 ${(1 - trayIn) * 24}px`
          if (travel > 0.96 && !sprung) {
            sprung = true
            gsap.fromTo(pose, { settle: 0.9 }, { settle: 0, duration: 1.05, ease: 'elastic.out(1, 0.52)', overwrite: 'auto' })
            gsap.fromTo(pose, { nudge: 1 }, { nudge: 0, duration: 1.15, ease: 'expo.out', overwrite: 'auto' })
          }
          if (travel < 0.82 && sprung) {
            sprung = false
            gsap.killTweensOf(pose, 'settle,nudge')
            pose.settle = 0
            pose.nudge = 0
          }
        },
      })
    }, el)

    let tiltOff = () => {}
    if (window.matchMedia('(pointer: fine)').matches) {
      const maxY = (18 * Math.PI) / 180
      const maxX = (15 * Math.PI) / 180
      const qy = gsap.quickTo(pose, 'tiltY', { duration: 0.6, ease: 'power3.out' })
      const qx = gsap.quickTo(pose, 'tiltX', { duration: 0.6, ease: 'power3.out' })
      const onMove = (e: PointerEvent) => {
        if (pose.cam > 0.05 || pose.spinning > 0.5) {
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
    }
  }, [reduced])

  if (reduced) {
    return (
      <>
        <Hero reduced />
        <Tray reduced />
      </>
    )
  }

  return (
    <section className={`opening ${ready ? 'is-ready' : ''}`} id="top" ref={section}>
      <div className="opening-pin" ref={pin}>
        <div className="opening-view" ref={track} />
        <div className="opening-copy" ref={copy}>
          <p className="eyebrow" data-testid="status-prototype" data-reveal data-reveal-now data-delay="0.15">
            <i />
            In development · not taking orders
          </p>
          <h1 data-split="now" data-delay="0.25">
            A personal AI memory, encrypted on a card you own.
          </h1>
          <p className="lede" data-reveal data-reveal-now data-delay="0.7">
            Mission keeps what an agent should know about you on a card you carry. A USB-C cable connects it to your laptop, or it pairs to your phone. Disconnect, and future access stops. Nothing is stored in a Mission cloud.
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
        </div>
        <div className="opening-tray-copy" id="carry" ref={trayCopy}>
          <p className="eyebrow">
            <i /> Everyday carry
          </p>
          <h2>It lives with the things you already take.</h2>
          <p>A card. A key. The rest of a pocket. Connect it when you want an agent to know you. Put it away when you don’t.</p>
        </div>
        <div className="opening-fallback" aria-hidden="true">
          <CardFace className="hero-card" />
        </div>
      </div>
    </section>
  )
}
