import { useEffect, useRef } from 'react'
import { EASE, gsap, ScrollTrigger } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'

const ITEMS = [
  { id: 'card', rest: -6, from: -16, lift: 1 },
  { id: 'key', src: '/media/tray/key.webp', alt: 'A black and gold car key fob', rest: -8, from: 14, lift: 0.85 },
  { id: 'airpods', src: '/media/tray/airpods.webp', alt: 'A white wireless earbud case', rest: 6, from: -18, lift: 0.9 },
  { id: 'wallet', src: '/media/tray/wallet.webp', alt: 'A brown leather card holder', rest: 4, from: 12, lift: 0.8 },
] as const

export function Tray({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const objs = gsap.utils.toArray<HTMLElement>('.tray-obj', el)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      objs.forEach((obj, i) => {
        const body = obj.querySelector<HTMLElement>('.tray-body')!
        const shadow = obj.querySelector<HTMLElement>('.tray-shadow')!
        const it = ITEMS[i]
        const h = el.querySelector<HTMLElement>('.tray-stage')!.clientHeight
        const at = i === 0 ? 0 : 0.42 + (i - 1) * 0.2
        const drop = 0.62 * it.lift
        gsap.set(body, { y: -h * 0.75 * it.lift, rotation: it.from, opacity: 0, transformOrigin: '50% 100%' })
        gsap.set(shadow, { scale: 2.1, opacity: 0 })
        tl.to(body, { opacity: 1, duration: 0.12, ease: 'none' }, at)
          .to(body, { y: 0, rotation: it.rest + (it.from > 0 ? 2 : -2), duration: drop, ease: EASE.fall }, at)
          .to(shadow, { scale: 1, opacity: 1, duration: drop, ease: 'power2.in' }, at)
          // contact: a short squash, then the object settles into the dish
          .to(body, { scaleY: 0.93, scaleX: 1.035, duration: 0.07, ease: 'power2.out' }, at + drop)
          .to(body, { scaleY: 1, scaleX: 1, rotation: it.rest, duration: 0.9, ease: 'elastic.out(1, 0.42)' }, at + drop + 0.07)
          .to(shadow, { scaleX: 1.06, duration: 0.07, ease: 'power2.out', yoyo: true, repeat: 1 }, at + drop)
      })
      tl.from('.tray-dish', { y: 24, opacity: 0, duration: 0.9, ease: EASE.out }, 0)
      ScrollTrigger.create({ trigger: '.tray-stage', start: 'top 72%', once: true, onEnter: () => tl.play() })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="tray" id="carry" ref={root}>
      <div className="tray-pin">
        <div className="tray-copy">
          <p className="eyebrow" data-reveal>
            <i /> Everyday carry
          </p>
          <h2 data-split>It lives with the things you already take.</h2>
          <p data-reveal>A card. A key. The rest of a pocket. Plug it in when you want an agent to know you. Put it back when you don’t.</p>
        </div>
        <div className="tray-stage">
          <div className="tray-dish" aria-hidden="true">
            <span className="tray-lip" />
          </div>
          {ITEMS.map((item) => (
            <div key={item.id} className={`tray-obj obj-${item.id}`}>
              <span className="tray-shadow" aria-hidden="true" />
              <div className="tray-body" style={{ ['--rest' as string]: `${item.rest}deg` }}>
                {item.id === 'card' ? <CardFace /> : <img src={item.src} alt={item.alt} width={640} height={640} loading="lazy" decoding="async" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
