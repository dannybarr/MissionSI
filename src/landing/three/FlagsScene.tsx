import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { AGENT_MARKS, type AgentMark } from '@/landing/sections/marks'
import { flagPose, flagSignals } from './flagPose'
import { isViewActive } from './stage'

/**
 * Agent ribbons: woven lanyard strips bunched off the top-right corner, streaming
 * out to forked tails on the left. Each strip is a deformed plane: a curved spine,
 * a travelling wave and a twist, lit as fabric (sheen + weave bump) so the colour
 * gradient comes from the folds, not from painted gradients.
 */

const SEG_L = 110
const SEG_W = 5
const TEX_W = 2560
const TEX_H = 112

// Fillers fill out the bundle the way the reference does: plain dyed strips behind the marks.
const FILLERS = ['#ececee', '#1a1a1b', '#d8382b', '#f2702a', '#2c58e0', '#8b3fe3', '#3cb54b', '#e4c63a', '#7b1d2e', '#27b496', '#e45fa6', '#f4f4f5']

type Spec = {
  mark: AgentMark | null
  cloth: string
  ink: string
  lane: number
  z: number
  reach: number
  bow: number
  amp: number
  freq: number
  phase: number
  twist: number
  width: number
  logoAt: number
  cut: 'fork' | 'angle'
  delay: number
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function buildSpecs(): Spec[] {
  const r = rng(20261019)
  const items: { mark: AgentMark | null; cloth: string; ink: string }[] = [
    ...AGENT_MARKS.map((m) => ({ mark: m, cloth: m.cloth, ink: m.ink })),
    ...FILLERS.map((c) => ({ mark: null, cloth: c, ink: '#ffffff' })),
  ]
  // Deterministic shuffle so colours interleave down the fan.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[items[i], items[j]] = [items[j]!, items[i]!]
  }
  return items.map((it, i) => {
    const lane = (i + 0.5) / items.length
    return {
      ...it,
      lane: lane + (r() - 0.5) * 0.03,
      // Marks sit forward of the plain strips; within each group depth is mixed.
      z: (it.mark ? 0.25 : -0.55) + (r() - 0.5) * 0.9,
      reach: 0.86 + r() * 0.2,
      bow: (r() - 0.5) * 0.22,
      amp: 0.7 + r() * 0.6,
      freq: 0.9 + r() * 0.7,
      phase: r() * Math.PI * 2,
      twist: (r() - 0.5) * 0.5,
      width: 0.9 + r() * 0.25,
      logoAt: 0.07 + r() * 0.2,
      cut: r() < 0.72 ? 'fork' : 'angle',
      delay: r() * 0.35,
    }
  })
}

function monoSvg(svg: string, ink: string) {
  return svg
    .replace(/fill="(?!none)[^"]*"/g, `fill="${ink}"`)
    .replace(/stop-color="[^"]*"/g, `stop-color="${ink}"`)
    .replace(/fill:\s*[^;"]+/g, `fill:${ink}`)
    .replace('<svg ', `<svg width="512" height="512" fill="${ink}" color="${ink}" `)
}

function loadSvg(svg: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

/** Woven polyester: warp lines, a 2/2 twill diagonal, fibre noise and a stitched selvedge. */
function paintCloth(ctx: CanvasRenderingContext2D, spec: Spec, logo: HTMLImageElement | null) {
  const W = TEX_W
  const H = TEX_H
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = spec.cloth
  ctx.fillRect(0, 0, W, H)

  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  const r = rng(spec.cloth.length * 977 + Math.round(spec.lane * 1e4))
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      // Twill: raised floats run diagonally every 4px; warp threads every 2px.
      const twill = ((x + y) & 3) < 2 ? 1 : -1
      const warp = y & 1 ? 0.5 : -0.5
      const fibre = (r() - 0.5) * 2
      const k = twill * 9 + warp * 5 + fibre * 7
      d[i] = Math.max(0, Math.min(255, d[i]! + k))
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1]! + k))
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2]! + k))
    }
  }
  ctx.putImageData(img, 0, 0)

  // Selvedge: a darker woven border with a fine highlight thread inside it.
  const edge = ctx.createLinearGradient(0, 0, 0, H)
  edge.addColorStop(0, 'rgba(0,0,0,0.32)')
  edge.addColorStop(0.07, 'rgba(0,0,0,0)')
  edge.addColorStop(0.93, 'rgba(0,0,0,0)')
  edge.addColorStop(1, 'rgba(0,0,0,0.36)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,0.09)'
  ctx.fillRect(0, 7, W, 1)
  ctx.fillRect(0, H - 8, W, 1)

  if (spec.mark) {
    const x0 = Math.round(W * spec.logoAt)
    const size = H * 0.56
    ctx.save()
    ctx.globalAlpha = 0.94
    if (logo) ctx.drawImage(logo, x0, (H - size) / 2, size, size)
    ctx.fillStyle = spec.ink
    ctx.font = `700 ${Math.round(H * 0.46)}px Geist, "Helvetica Neue", Arial, sans-serif`
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '-1px'
    ctx.fillText(spec.mark.name, x0 + size + H * 0.22, H / 2 + 2)
    ctx.restore()
    // Screen print sits on the weave: knock a little of the texture back through it.
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.12
    ctx.fillStyle = '#808080'
    for (let x = x0; x < x0 + H * 5; x += 4) ctx.fillRect(x, 0, 1, H)
    ctx.restore()
  }

  // Tail cut: a forked swallowtail or a single bias cut.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  if (spec.cut === 'fork') {
    ctx.moveTo(-1, -1)
    ctx.lineTo(H * 0.95, H / 2)
    ctx.lineTo(-1, H + 1)
  } else {
    ctx.moveTo(-1, -1)
    ctx.lineTo(H * 1.15, -1)
    ctx.lineTo(-1, H + 1)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function stripGeometry() {
  const g = new THREE.BufferGeometry()
  const n = (SEG_L + 1) * (SEG_W + 1)
  const pos = new Float32Array(n * 3)
  const uv = new Float32Array(n * 2)
  for (let i = 0; i <= SEG_L; i++) {
    for (let j = 0; j <= SEG_W; j++) {
      const k = i * (SEG_W + 1) + j
      uv[k * 2] = i / SEG_L
      uv[k * 2 + 1] = j / SEG_W
    }
  }
  const idx: number[] = []
  for (let i = 0; i < SEG_L; i++) {
    for (let j = 0; j < SEG_W; j++) {
      const a = i * (SEG_W + 1) + j
      const b = a + SEG_W + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  g.setIndex(idx)
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.computeBoundingSphere()
  return g
}

function StudioEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const tex = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    scene.environment = tex
    scene.environmentIntensity = 0.5
    return () => {
      scene.environment = null
      tex.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

const spine = new THREE.Vector3()
const prev = new THREE.Vector3()
const tan = new THREE.Vector3()
const side = new THREE.Vector3()
const face = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const A = new THREE.Vector3()
const T = new THREE.Vector3()
const C = new THREE.Vector3()

function bezier(out: THREE.Vector3, a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number) {
  const u = 1 - t
  out.set(u * u * a.x + 2 * u * t * c.x + t * t * b.x, u * u * a.y + 2 * u * t * c.y + t * t * b.y, u * u * a.z + 2 * u * t * c.z + t * t * b.z)
  return out
}

export function FlagsScene() {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const group = useRef<THREE.Group>(null)
  const size = useThree((s) => s.size)
  const ready = useRef(false)
  const clock = useRef(0)
  const specs = useMemo(() => buildSpecs(), [])

  const strips = useMemo(
    () =>
      specs.map((spec) => {
        const canvas = document.createElement('canvas')
        canvas.width = TEX_W
        canvas.height = TEX_H
        const map = new THREE.CanvasTexture(canvas)
        map.colorSpace = THREE.SRGBColorSpace
        map.anisotropy = 8
        const bump = new THREE.CanvasTexture(canvas)
        bump.colorSpace = THREE.NoColorSpace
        const material = new THREE.MeshPhysicalMaterial({
          map,
          bumpMap: bump,
          bumpScale: 1.6,
          roughness: 0.78,
          metalness: 0,
          sheen: 0.3,
          sheenRoughness: 0.5,
          sheenColor: new THREE.Color('#d8d8dc'),
          side: THREE.DoubleSide,
          alphaTest: 0.5,
          envMapIntensity: 0.35,
        })
        return { spec, canvas, map, bump, material, geometry: stripGeometry() }
      }),
    [specs],
  )

  useEffect(() => {
    let live = true
    const paint = async () => {
      await document.fonts?.load('700 48px Geist').catch(() => {})
      for (const s of strips) {
        if (!live) return
        const logo = s.spec.mark ? await loadSvg(monoSvg(s.spec.mark.svg, s.spec.ink)) : null
        const ctx = s.canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) continue
        paintCloth(ctx, s.spec, logo)
        s.map.needsUpdate = true
        s.bump.needsUpdate = true
      }
    }
    // Paint plain cloth first so the strips never render as blank white.
    for (const s of strips) {
      const ctx = s.canvas.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.fillStyle = s.spec.cloth
        ctx.fillRect(0, 0, TEX_W, TEX_H)
        s.map.needsUpdate = true
      }
    }
    paint()
    return () => {
      live = false
      for (const s of strips) {
        s.map.dispose()
        s.bump.dispose()
        s.material.dispose()
        s.geometry.dispose()
      }
    }
  }, [strips])

  useFrame((state, dt) => {
    const camera = cam.current
    if (!camera || size.width < 2) return
    // Off screen: skip the per-frame rebuild of every ribbon (the shared canvas keeps ticking for other views).
    if (ready.current && !isViewActive('flags')) return
    const step = Math.min(dt, 0.05)
    flagPose.wind = Math.max(0, flagPose.wind - step * 0.55)
    clock.current += step * (1 + flagPose.wind * 1.6)
    const t = clock.current

    const aspect = size.width / size.height
    const portrait = aspect < 1
    const fov = 24
    const dist = 30
    camera.fov = fov
    camera.position.set(0, 0, dist)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    const visH = 2 * dist * Math.tan((fov * Math.PI) / 360)
    const visW = visH * aspect
    const unit = Math.min(visH, visW * 0.8)
    const baseWidth = unit * (portrait ? 0.08 : 0.074)

    if (group.current) group.current.position.y = flagPose.drift * unit * 0.12

    for (const s of strips) {
      const sp = s.spec
      const lane = sp.lane
      // The fan: the middle of the bundle reaches furthest left, the outer strips curl back.
      const reachX = portrait ? -0.46 + Math.abs(lane - 0.5) * 0.35 : -0.1 + Math.pow(Math.abs(lane - 0.45), 1.5) * 0.38
      const tailY = portrait ? THREE.MathUtils.lerp(0.42, -0.06, lane) : THREE.MathUtils.lerp(0.25, -0.33, lane)
      T.set(visW * reachX * sp.reach + (1 - sp.reach) * visW * 0.3, visH * tailY, sp.z)
      // Bunched end: the bundle leaves through the top edge and the upper right edge, wide like a held sheaf.
      A.set(visW * (portrait ? 0.62 + lane * 0.12 : 0.52 + lane * 0.1), visH * (portrait ? 0.6 - lane * 0.4 : 0.62 - lane * 0.55), sp.z * 0.4)
      const open = THREE.MathUtils.clamp((flagPose.unfurl - sp.delay * 0.6) / 0.7, 0, 1)
      const ease = 1 - Math.pow(1 - open, 3)
      // Strips are drawn out of the corner rather than stretched, so the weave never smears.
      T.lerp(A, (1 - ease) * 0.95)
      C.set((T.x + A.x) / 2, (T.y + A.y) / 2 + visH * sp.bow, sp.z * 0.5)
      const reach = A.x - T.x
      const amp = unit * 0.028 * sp.amp * (0.6 + flagPose.wind * 0.9) * (0.35 + 0.65 * ease)
      const w = baseWidth * sp.width

      const pos = s.geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let i = 0; i <= SEG_L; i++) {
        const u = i / SEG_L
        bezier(spine, T, C, A, u)
        // Free tail flutters; the bunched end barely moves.
        const free = Math.pow(1 - u, 1.25)
        const wave = 2 * Math.PI * sp.freq * u - t * 2.1 + sp.phase
        spine.y += Math.sin(wave) * amp * free
        spine.z += Math.cos(wave * 0.8 + 0.6) * amp * 1.5 * free
        spine.x += Math.sin(wave * 0.5) * amp * 0.25 * free * (reach > 0 ? 1 : -1)
        if (i === 0) {
          bezier(prev, T, C, A, 0.004)
          tan.subVectors(prev, spine)
        } else {
          tan.subVectors(spine, prev)
        }
        tan.normalize()
        prev.copy(spine)
        side.copy(up).addScaledVector(tan, -tan.dot(up)).normalize()
        face.crossVectors(tan, side)
        const twist = sp.twist * (0.4 + 0.6 * free) + Math.sin(wave * 0.7 + 1.3) * 0.32 * free
        const c = Math.cos(twist)
        const sn = Math.sin(twist)
        const wx = side.x * c + face.x * sn
        const wy = side.y * c + face.y * sn
        const wz = side.z * c + face.z * sn
        const taper = 1 - u * 0.12
        for (let j = 0; j <= SEG_W; j++) {
          const v = (j / SEG_W - 0.5) * w * taper
          const k = (i * (SEG_W + 1) + j) * 3
          arr[k] = spine.x + wx * v
          arr[k + 1] = spine.y + wy * v
          arr[k + 2] = spine.z + wz * v
        }
      }
      pos.needsUpdate = true
      s.geometry.computeVertexNormals()
      s.geometry.computeBoundingSphere()
    }
    if (!ready.current) {
      ready.current = true
      flagSignals.onReady()
    }
    void state
  })

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={24} near={0.5} far={120} position={[0, 0, 30]} />
      <StudioEnv />
      <hemisphereLight args={['#ffffff', '#55555c', 0.32]} />
      <directionalLight
        position={[-7, 11, 14]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-radius={5}
        shadow-camera-near={2}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[9, -3, 8]} intensity={0.45} />
      <group ref={group}>
        {strips.map((s, i) => (
          <mesh key={i} geometry={s.geometry} material={s.material} castShadow receiveShadow frustumCulled={false} />
        ))}
      </group>
    </>
  )
}
