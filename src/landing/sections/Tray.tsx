import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CardFace } from '@/landing/components/CardFace'

gsap.registerPlugin(ScrollTrigger)

const ITEMS = [
  { id: 'key', src: '/media/tray/key.webp', alt: 'A black and gold car key fob', style: 'item-key' },
  { id: 'airpods', src: '/media/tray/airpods.webp', alt: 'A white wireless earbud case', style: 'item-airpods' },
  { id: 'wallet', src: '/media/tray/wallet.webp', alt: 'A brown leather card holder', style: 'item-wallet' },
]

export function Tray({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const card = el.querySelector('.tray-card')
    const items = el.querySelectorAll('.tray-item')
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      })
      tl.fromTo(card, { y: -220, rotation: -8, opacity: 0 }, { y: 0, rotation: -6, opacity: 1, duration: 0.4, ease: 'power2.out' })
      items.forEach((item, i) => {
        tl.fromTo(
          item,
          { y: -160 - i * 20, rotation: i % 2 ? 12 : -10, opacity: 0 },
          { y: 0, rotation: i === 0 ? -8 : i === 1 ? 6 : 4, opacity: 1, duration: 0.32, ease: 'back.out(1.4)' },
          0.28 + i * 0.16,
        )
      })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="tray" id="carry" ref={root}>
      <div className="tray-pin">
        <div className="tray-copy">
          <p className="eyebrow">Everyday carry</p>
          <h2>It lives with the things you already take.</h2>
          <p>A card. A key. The rest of a pocket. Pull it when you want an agent to know you. Put it back when you don’t.</p>
        </div>
        <div className="tray-stage" style={{ ['--tray' as string]: '#c9c3dc' }}>
          <div className="tray-bed" />
          <div className="tray-card">
            <CardFace />
          </div>
          {ITEMS.map((item) => (
            <img key={item.id} className={`tray-item ${item.style}`} src={item.src} alt={item.alt} width={640} height={640} />
          ))}
        </div>
      </div>
    </section>
  )
}
