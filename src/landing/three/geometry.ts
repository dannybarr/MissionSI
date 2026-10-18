import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'

/**
 * Card in centimetres, measured off the front view of card-prototype-views.png.
 * 86 × 55 mm. One rectangular notch on the top, one on the bottom (same station,
 * just left of centre), and one on each short edge. The USB-C port sits in the left one.
 */
export const CARD = { w: 8.6, h: 5.5, t: 0.48 }

/** Notch along an axis: [start, end, depth], with a short machined ramp at each wall. */
const LONG_NOTCH = { a: -1.23, b: 0.98, depth: 0.21, ramp: 0.14 }
const SIDE_NOTCH = { a: -0.85, b: 1.05, depth: 0.17, ramp: 0.12 }

function cut(p: number, a: number, b: number, depth: number, ramp: number) {
  const enter = Math.max(0, Math.min(1, (p - (a - ramp)) / ramp))
  const exit = Math.max(0, Math.min(1, (p - b) / ramp))
  return depth * (enter - exit)
}

/** Closed outline, centred, y up. inset 0 is the outer rim; a larger inset drops the notches. */
export function outlinePoints(inset: number, step = 0.035): THREE.Vector2[] {
  const W = CARD.w - inset * 2
  const H = CARD.h - inset * 2
  const r = Math.max(0.06, 0.32 - inset * 0.35)
  const x0 = -W / 2
  const x1 = W / 2
  const y0 = -H / 2
  const y1 = H / 2
  // The inset face follows the machined silhouette, including all four reliefs.
  const long = LONG_NOTCH
  const side = SIDE_NOTCH
  const pts: THREE.Vector2[] = []
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = 8
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
    }
  }
  const edge = (from: number, to: number, f: (t: number) => THREE.Vector2) => {
    const n = Math.max(2, Math.ceil(Math.abs(to - from) / step))
    for (let i = 1; i < n; i++) pts.push(f(from + ((to - from) * i) / n))
  }
  edge(x0 + r, x1 - r, (x) => new THREE.Vector2(x, y0 + cut(x, long.a, long.b, long.depth, long.ramp)))
  arc(x1 - r, y0 + r, -Math.PI / 2, 0)
  edge(y0 + r, y1 - r, (y) => new THREE.Vector2(x1 - cut(y, side.a, side.b, side.depth, side.ramp), y))
  arc(x1 - r, y1 - r, 0, Math.PI / 2)
  edge(x1 - r, x0 + r, (x) => new THREE.Vector2(x, y1 - cut(x, long.a, long.b, long.depth, long.ramp)))
  arc(x0 + r, y1 - r, Math.PI / 2, Math.PI)
  edge(y1 - r, y0 + r, (y) => new THREE.Vector2(x0 + cut(y, side.a, side.b, side.depth, side.ramp), y))
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
  const g = new THREE.ExtrudeGeometry(capsule(0.9, 0.3), {
    depth: 0.95,
    curveSegments: 12,
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
  const bevel = 0.05
  let body: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shapeOf(0), {
    depth: CARD.t - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.08,
    bevelSegments: 1,
    curveSegments: 8,
  })
  body = centerZ(body)
  const front = body.boundingBox!.max.z
  const back = body.boundingBox!.min.z
  const left = body.boundingBox!.min.x
  body = subtract(body, portCutter(left))
  body = subtract(body, pocketCutter(front, 0.09, 0.28))
  body = subtract(body, pocketBack(back))

  const panel = new THREE.ExtrudeGeometry(shapeOf(0.32), {
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
  const depth = 0.09
  const g = new THREE.ExtrudeGeometry(shapeOf(0.28), { depth, curveSegments: 6, bevelEnabled: false })
  g.translate(0, 0, back - 0.012)
  return g
}

function portInsert() {
  const depth = 0.58
  const mouth = -CARD.w / 2 + SIDE_NOTCH.depth
  const shellShape = capsule(0.86, 0.28)
  shellShape.holes.push(new THREE.Path(capsule(0.78, 0.2).getPoints(20).reverse()))
  const shell = new THREE.ExtrudeGeometry(shellShape, { depth: 0.16, curveSegments: 10, bevelEnabled: false })
  shell.rotateY(Math.PI / 2)
  shell.computeBoundingBox()
  shell.translate(mouth - 0.012 - shell.boundingBox!.min.x, 0, 0)

  const cavity = new THREE.ExtrudeGeometry(capsule(0.78, 0.2), { depth: 0.05, curveSegments: 10, bevelEnabled: false })
  cavity.rotateY(Math.PI / 2)
  cavity.computeBoundingBox()
  cavity.translate(mouth + depth - cavity.boundingBox!.max.x, 0, 0)

  const tongue = new THREE.BoxGeometry(0.26, 0.64, 0.045)
  tongue.translate(mouth + depth - 0.18, 0, 0)

  const pins: THREE.BufferGeometry[] = []
  for (const z of [0.03, -0.03]) {
    for (let i = 0; i < 8; i++) {
      const p = new THREE.BoxGeometry(0.16, 0.028, 0.012)
      p.translate(-CARD.w / 2 + SIDE_NOTCH.depth + depth - 0.26, (i - 3.5) * 0.055, z)
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
