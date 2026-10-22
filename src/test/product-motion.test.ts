import { describe, expect, it } from 'vitest'
import { productMotion } from '../landing/three/productMotion'

const channels = ['spin', 'pitch', 'inspection', 'cam', 'lay', 'flat', 'bank', 'rock', 'copy', 'trayCopy'] as const

describe('product presentation', () => {
  it('keeps the printed face towards the viewer and never spins a full turn', () => {
    for (let p = 0; p <= 1; p += 0.001) {
      const motion = productMotion(p)
      expect(Math.abs(motion.spin)).toBeLessThan(Math.PI / 2)
      expect(Math.abs(motion.rock)).toBeLessThan(0.06)
    }
  })
  it('starts in the hero and ends at rest in the tray', () => {
    expect(productMotion(0)).toMatchObject({ cam: 0, lay: 0, flat: 0, bank: 0, rock: 0, copy: 1, trayCopy: 0 })
    expect(productMotion(1)).toMatchObject({ cam: 1, lay: 1, flat: 1, bank: 0, rock: 0, copy: 0, trayCopy: 1 })
  })
  it('levels the card before it touches down', () => {
    for (let p = 0.86; p <= 1; p += 0.002) expect(productMotion(p).bank).toBeLessThan(0.02)
  })
  it('has no dead stretches: something visibly moves with every step of scroll', () => {
    const step = 0.005
    for (let p = 0; p < 0.96; p += step) {
      const a = productMotion(p)
      const b = productMotion(p + step)
      const moved = Math.max(...channels.map((k) => Math.abs(b[k] - a[k])))
      expect(moved, `at p=${p.toFixed(3)}`).toBeGreaterThan(0.0015)
    }
  })
  it('returns exactly the same pose on reverse scrolling', () => {
    const forward = Array.from({ length: 101 }, (_, i) => productMotion(i / 100))
    for (let i = 100; i >= 0; i--) expect(productMotion(i / 100)).toEqual(forward[i])
  })
})
