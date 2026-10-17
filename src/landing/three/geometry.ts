import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'

/** Card in centimetres. 86 × 55 mm, slim enough to read as a card, thick enough for a USB-C opening. */
export const CARD = { w: 8.6, h: 5.5, t: 0.4 }

const TOP_NOTCHES = [-1.28, 1.42]
const BOTTOM_NOTCHES = [-1.42, 1.22]

function smooth(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a || 1e-4)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function notch(x: number, centers: number[], half: number, ramp: number, depth: number) {
  let d = 0
  for (const c of centers) d += smooth(c - half - ramp, c - half, x) * (1 - smooth(c + half, c + half + ramp, x))
  return d * depth
}

/** Closed outline, centred, y up. Two scoops on the top, two on the bottom, one on each side. */
export function outlinePoints(inset: number, step = 0.04): THREE.Vector2[] {
  const W = CARD.w - inset * 2
  const H = CARD.h - inset * 2
  const r = Math.max(0.05, 0.34 - inset * 0.4)
  const x0 = -W / 2
  const x1 = W / 2
  const y0 = -H / 2
  const y1 = H / 2
  const depth = Math.max(0, 0.168 - inset * 0.22)
  const sideD = Math.max(0, 0.132 - inset * 0.2)
  const half = 0.46
  const ramp = 0.24
  const pts: THREE.Vector2[] = []
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = 7
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
    }
  }
  const edge = (from: number, to: number, f: (t: number) => THREE.Vector2) => {
    const n = Math.max(2, Math.ceil(Math.abs(to - from) / step))
    for (let i = 1; i < n; i++) pts.push(f(from + ((to - from) * i) / n))
  }
  edge(x0 + r, x1 - r, (x) => new THREE.Vector2(x, y0 + notch(x, BOTTOM_NOTCHES, half, ramp, depth)))
  arc(x1 - r, y0 + r, -Math.PI / 2, 0)
  edge(y0 + r, y1 - r, (y) => new THREE.Vector2(x1 - notch(y, [0], 0.7, 0.26, sideD), y))
  arc(x1 - r, y1 - r, 0, Math.PI / 2)
  edge(x1 - r, x0 + r, (x) => new THREE.Vector2(x, y1 - notch(x, TOP_NOTCHES, half, ramp, depth)))
  arc(x0 + r, y1 - r, Math.PI / 2, Math.PI)
  edge(y1 - r, y0 + r, (y) => new THREE.Vector2(x0 + notch(y, [0], 0.7, 0.26, sideD), y))
  arc(x0 + r, y0 + r, Math.PI, Math.PI * 1.5)
  return pts
}

function shapeOf(inset: number) {
  return new THREE.Shape(outlinePoints(inset))
}

/** Stadium cross-section. Local X is the short axis, local Y the long axis. */
function capsule(long: number, girth: number) {
  const r = girth / 2
  const hy = Math.max(0.001, long / 2 - r)
  const s = new THREE.Shape()
  s.moveTo(-r, -hy)
  s.lineTo(-r, hy)
  s.absarc(0, hy, r, Math.PI, 0, true)
  s.lineTo(r, -hy)
  s.absarc(0, -hy, r, 0, -Math.PI, true)
  return s
}

function centerZ(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox()
  const c = geo.boundingBox!.getCenter(new THREE.Vector3())
  geo.translate(-c.x, -c.y, -c.z)
  geo.computeBoundingBox()
  return geo
}

function subtract(base: THREE.BufferGeometry, tool: THREE.BufferGeometry) {
  try {
    const ev = new Evaluator()
    ev.attributes = ['position', 'normal', 'uv']
    ev.useGroups = false
    const a = new Brush(base)
    const b = new Brush(tool)
    a.updateMatrixWorld()
    b.updateMatrixWorld()
    const out = ev.evaluate(a, b, SUBTRACTION).geometry
    out.computeVertexNormals()
    base.dispose()
    return out
  } catch (err) {
    console.warn('Mission card boolean failed', err)
    return base
  } finally {
    tool.dispose()
  }
}

function portCutter(leftEdge: number) {
  const g = new THREE.ExtrudeGeometry(capsule(0.86, 0.236), {
    depth: 0.95,
    curveSegments: 10,
    bevelEnabled: false,
  })
  // Extrusion runs along +Z. Turn it so it runs from the left edge inward (+X),
  // with the long axis of the opening along the card's left edge (Y).
  g.rotateY(Math.PI / 2)
  g.computeBoundingBox()
  g.translate(leftEdge - 0.16 - g.boundingBox!.min.x, 0, 0)
  return g
}

function pocketCutter(front: number, depth: number, inset: number) {
  const g = new THREE.ExtrudeGeometry(shapeOf(inset), { depth, curveSegments: 5, bevelEnabled: false })
  g.translate(0, 0, front - depth + 0.012)
  return g
}

export interface CardGeos {
  body: THREE.BufferGeometry
  panel: THREE.BufferGeometry
  /** Z of the recessed face the print sits on. */
  faceZ: number
  shell: THREE.BufferGeometry
  cavity: THREE.BufferGeometry
  tongue: THREE.BufferGeometry
  pins: THREE.BufferGeometry
}

let cached: CardGeos | null = null

export function cardGeometries(): CardGeos {
  if (cached) return cached
  const bevel = 0.028
  let body: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shapeOf(0), {
    depth: CARD.t - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 6,
  })
  body = centerZ(body)
  const front = body.boundingBox!.max.z
  const back = body.boundingBox!.min.z
  const left = body.boundingBox!.min.x
  body = subtract(body, portCutter(left))
  body = subtract(body, pocketCutter(front, 0.055, 0.16))
  body = subtract(body, pocketBack(back))

  const panel = new THREE.ExtrudeGeometry(shapeOf(0.2), {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.006,
    bevelSegments: 1,
    curveSegments: 5,
  })
  panel.computeBoundingBox()
  const pz = panel.boundingBox!.max.z
  const faceZ = front - 0.03
  panel.translate(0, 0, faceZ - pz)

  const port = portInsert()
  cached = { body, panel, faceZ, ...port }
  return cached
}

function pocketBack(back: number) {
  const g = new THREE.ExtrudeGeometry(shapeOf(0.16), { depth: 0.05, curveSegments: 5, bevelEnabled: false })
  g.translate(0, 0, back - 0.012)
  return g
}

function portInsert() {
  const depth = 0.62
  const shellShape = capsule(0.8, 0.2)
  shellShape.holes.push(new THREE.Path(capsule(0.74, 0.15).getPoints(16).reverse()))
  const shell = new THREE.ExtrudeGeometry(shellShape, { depth: depth - 0.08, curveSegments: 8, bevelEnabled: false })
  shell.rotateY(Math.PI / 2)
  shell.computeBoundingBox()
  shell.translate(-CARD.w / 2 + 0.02 - shell.boundingBox!.min.x, 0, 0)

  const cavity = new THREE.ExtrudeGeometry(capsule(0.74, 0.15), { depth: 0.06, curveSegments: 8, bevelEnabled: false })
  cavity.rotateY(Math.PI / 2)
  cavity.computeBoundingBox()
  cavity.translate(-CARD.w / 2 + depth - cavity.boundingBox!.max.x, 0, 0)

  const tongue = new THREE.BoxGeometry(0.28, 0.62, 0.05)
  tongue.translate(-CARD.w / 2 + depth - 0.2, 0, 0)

  const pins: THREE.BufferGeometry[] = []
  for (const z of [0.03, -0.03]) {
    for (let i = 0; i < 8; i++) {
      const p = new THREE.BoxGeometry(0.16, 0.028, 0.012)
      p.translate(-CARD.w / 2 + depth - 0.28, (i - 3.5) * 0.055, z)
      pins.push(p)
    }
  }
  const merged = mergePins(pins)
  return { shell, cavity, tongue, pins: merged }
}

function mergePins(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p))
  let count = 0
  for (const p of flat) count += (p.getAttribute('position') as THREE.BufferAttribute).count
  const pos = new Float32Array(count * 3)
  const norm = new Float32Array(count * 3)
  let o = 0
  for (const p of flat) {
    const a = p.getAttribute('position') as THREE.BufferAttribute
    const n = p.getAttribute('normal') as THREE.BufferAttribute
    pos.set(a.array as Float32Array, o * 3)
    if (n) norm.set(n.array as Float32Array, o * 3)
    o += a.count
    p.dispose()
  }
  for (const p of parts) if (!flat.includes(p)) p.dispose()
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(norm, 3))
  return g
}
