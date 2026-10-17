import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '@/landing/lib/motion'

/** Leans toward a nearby pointer and drifts back when it leaves. Fine pointers only, never with reduced motion. */
export function Magnetic({ children, className = '', strength = 0.3, radius = 120 }: { children: ReactNode; className?: string; strength?: number; radius?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })
    let engaged = false
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2 - (Number(gsap.getProperty(el, 'x')) || 0)
      const cy = r.top + r.height / 2 - (Number(gsap.getProperty(el, 'y')) || 0)
      const x = e.clientX - cx
      const y = e.clientY - cy
      const reach = radius + Math.max(r.width, r.height) / 2
      if (Math.hypot(x, y) > reach) {
        if (engaged) {
          engaged = false
          xTo(0)
          yTo(0)
        }
        return
      }
      engaged = true
      xTo(x * strength)
      yTo(y * strength)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.set(el, { clearProps: 'transform' })
    }
  }, [strength, radius])
  return (
    <span ref={ref} className={`magnetic ${className}`}>
      {children}
    </span>
  )
}
