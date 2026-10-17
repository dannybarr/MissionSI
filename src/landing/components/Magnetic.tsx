import { useEffect, useRef, type ReactNode } from 'react'

/** Pulls slightly toward the pointer. Disabled for touch and reduced motion. */
export function Magnetic({ children, className = '', strength = 0.28 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fine = window.matchMedia('(pointer: fine)').matches
    if (!fine) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(x, y)
      if (dist > 140) {
        el.style.transform = ''
        return
      }
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    }
    const reset = () => {
      el.style.transform = ''
    }
    window.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', reset)
    }
  }, [strength])
  return (
    <span ref={ref} className={`magnetic ${className}`}>
      {children}
    </span>
  )
}
