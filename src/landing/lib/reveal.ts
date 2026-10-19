import { useEffect } from 'react'
import { DUR, EASE, gsap, prefersStatic, ScrollTrigger, SplitText } from './motion'

/**
 * Scroll reveals for the whole landing page.
 *  - `[data-split]` headings rise line by line out of a mask.
 *  - `[data-reveal]` copy fades up a short distance. `data-reveal="stagger"` staggers its children.
 * Headings inside a pinned or scrubbed section still reveal on entry; they are not scrubbed.
 */
export function useReveals(reduced: boolean) {
  useEffect(() => {
    if (reduced || prefersStatic()) return
    const root = document.querySelector<HTMLElement>('.mission-site')
    if (!root) return
    let ctx: gsap.Context | null = null
    let cancelled = false

    const run = () => {
      if (cancelled) return
      ctx = gsap.context(() => {
        root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
          const immediate = el.dataset.split === 'now'
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-line',
            autoSplit: true,
            onSplit(self) {
              gsap.set(el, { visibility: 'visible' })
              return gsap.from(self.lines, {
                yPercent: 112,
                rotation: 2.5,
                transformOrigin: '0% 100%',
                // Above-the-fold headlines also resolve out of a soft focus.
                ...(immediate ? { filter: 'blur(12px)', clearProps: 'filter' } : {}),
                duration: DUR.type,
                ease: EASE.out,
                stagger: 0.075,
                delay: immediate ? Number(el.dataset.delay ?? 0.1) : 0,
                scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 88%', once: true },
              })
            },
          })
        })

        root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          const stagger = el.dataset.reveal === 'stagger'
          const targets = stagger ? Array.from(el.children) : el
          const immediate = el.dataset.revealNow !== undefined
          gsap.from(targets, {
            y: 26,
            opacity: 0,
            duration: DUR.copy,
            ease: EASE.out,
            stagger: stagger ? 0.08 : 0,
            delay: immediate ? Number(el.dataset.delay ?? 0.35) : 0.06,
            clearProps: 'transform,opacity',
            scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 90%', once: true },
          })
          gsap.set(el, { visibility: 'visible' })
        })
      }, root)
      ScrollTrigger.refresh()
    }

    // Split after webfonts settle, or line breaks are measured against the fallback face.
    const fonts = document.fonts?.ready
    if (fonts) fonts.then(run, run)
    else run()

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [reduced])
}
