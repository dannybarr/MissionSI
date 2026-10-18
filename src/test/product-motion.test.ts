import { describe, expect, it } from 'vitest'
import { productMotion } from '../landing/three/productMotion'

describe('product presentation', () => {
  it('keeps the printed face towards the viewer and never spins a full turn', () => {
    for (let p = 0; p <= 1; p += 0.001) {
      const motion = productMotion(p)
      expect(Math.abs(motion.spin)).toBeLessThan(Math.PI / 2)
      expect(motion.settle).toBeGreaterThanOrEqual(0)
    }
  })
  it('disconnects before travelling to the tray and ends at rest', () => {
    for (let p = 0.71; p <= 1; p += 0.005) {
      expect(productMotion(p).insertion).toBe(0)
      expect(productMotion(p).connection).toBe(0)
    }
    expect(productMotion(1)).toMatchObject({ cam: 1, settle: 0, trayCopy: 1, copy: 0 })
  })
  it('returns exactly the same pose on reverse scrolling', () => {
    const forward = Array.from({ length: 101 }, (_, i) => productMotion(i / 100))
    for (let i = 100; i >= 0; i--) expect(productMotion(i / 100)).toEqual(forward[i])
  })
})
