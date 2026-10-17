import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, RoundedBox } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { pose, signals } from './pose'
import { CARD } from './geometry'
import { drawHeroPrint, printPlaneSize } from './print'
import { ProductCard } from './ProductCard'
import { KeyFob } from './KeyFob'
import { AirPods } from './AirPods'

const TRAY_Y = -19
const hero = new THREE.Vector3()
const slot = new THREE.Vector3()
const look = new THREE.Vector3()
const lookT = new THREE.Vector3()
const camPos = new THREE.Vector3()

function StudioEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const tex = pmrem.fromScene(room, 0.04).texture
    scene.environment = tex
    scene.environmentIntensity = 0.42
    return () => {
      scene.environment = null
      tex.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function useHeroPrint() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    const plane = printPlaneSize()
    c.width = 2048
    c.height = Math.round(2048 * (plane.h / plane.w))
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { c, t }
  }, [])
  useEffect(() => {
    let live = true
    const draw = (img: CanvasImageSource | null) => {
      const ctx = tex.c.getContext('2d')
      if (!ctx) return
      drawHeroPrint(ctx, tex.c.width, tex.c.height, img)
      tex.t.needsUpdate = true
    }
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => live && draw(img)
    img.src = '/assets/nasa/earth.webp'
    document.fonts?.load('500 64px Geist').then(() => live && img.complete && draw(img)).catch(() => {})
    return () => {
      live = false
      tex.t.dispose()
    }
  }, [tex])
  return tex.t
}

function blobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const rad = g.createRadialGradient(64, 64, 6, 64, 64, 64)
  rad.addColorStop(0, 'rgba(30, 24, 48, 0.5)')
  rad.addColorStop(0.55, 'rgba(30, 24, 48, 0.16)')
  rad.addColorStop(1, 'rgba(30, 24, 48, 0)')
  g.fillStyle = rad
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

function Tray() {
  const geos = useMemo(() => {
    const w = 33
    const h = 23
    const r = 2.6
    const wall = 0.9
    const height = 1.65
    const outer = roundedShape(w, h, r)
    const inner = roundedShape(w - wall * 2, h - wall * 2, r - wall)
    outer.holes.push(new THREE.Path(inner.getPoints(64).reverse()))
    const walls = new THREE.ExtrudeGeometry(outer, {
      depth: height,
      bevelEnabled: true,
      bevelSize: 0.14,
      bevelThickness: 0.1,
      bevelSegments: 2,
      curveSegments: 10,
    })
    walls.rotateX(-Math.PI / 2)
    walls.computeBoundingBox()
    walls.translate(0, -walls.boundingBox!.min.y, 0)
    const floor = new THREE.ExtrudeGeometry(inner, { depth: 0.16, curveSegments: 10, bevelEnabled: false })
    floor.rotateX(-Math.PI / 2)
    floor.computeBoundingBox()
    floor.translate(0, -floor.boundingBox!.min.y + 0.12, 0)
    return { walls, floor }
  }, [])
  useEffect(
    () => () => {
      geos.walls.dispose()
      geos.floor.dispose()
    },
    [geos],
  )
  const wallMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d4c9e8',
        roughness: 0.18,
        metalness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.2,
        sheen: 0.45,
        sheenColor: new THREE.Color('#f6f3fb'),
        sheenRoughness: 0.4,
      }),
    [],
  )
  const floorMat = useMemo(() => {
    const m = wallMat.clone()
    m.color.set('#e4dcf3')
    m.roughness = 0.1
    m.clearcoatRoughness = 0.08
    return m
  }, [wallMat])
  useEffect(
    () => () => {
      wallMat.dispose()
      floorMat.dispose()
    },
    [wallMat, floorMat],
  )
  return (
    <group>
      <mesh geometry={geos.walls} material={wallMat} castShadow receiveShadow />
      <mesh geometry={geos.floor} material={floorMat} receiveShadow />
    </group>
  )
}

function Carry({ blob }: { blob: THREE.Texture }) {
  const leather = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(128, 128)
    let s = 42
    for (let i = 0; i < 128 * 128; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0
      const n = 150 + ((s >>> 8) & 255) * 0.25
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = n
      img.data[i * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 2)
    t.colorSpace = THREE.NoColorSpace
    return t
  }, [])
  const key = useRef<THREE.Group>(null)
  const pods = useRef<THREE.Group>(null)
  const wallet = useRef<THREE.Group>(null)
  useEffect(() => () => leather.dispose(), [leather])
  useFrame(() => {
    const n = pose.nudge
    if (key.current) key.current.rotation.y = -0.55 + n * 0.07
    if (pods.current) pods.current.rotation.y = 0.28 - n * 0.05
    if (wallet.current) wallet.current.rotation.y = 0.22 + n * 0.05
  })
  return (
    <group>
      <group ref={key} position={[-8.2, 0.55, 0.2]} rotation={[0, -0.55, 0]}>
        <KeyFob />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0.2]}>
          <planeGeometry args={[4.2, 7.4]} />
          <meshBasicMaterial map={blob} transparent depthWrite={false} opacity={0.85} />
        </mesh>
      </group>

      <group ref={pods} position={[6.6, 1.15, -4.6]} rotation={[0, 0.35, 0]}>
        <AirPods />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
          <planeGeometry args={[8.5, 7.2]} />
          <meshBasicMaterial map={blob} transparent depthWrite={false} opacity={0.65} />
        </mesh>
      </group>

      <group ref={wallet} position={[3.2, 0.4, 6.4]} rotation={[0, 0.12, 0]}>
        <RoundedBox args={[9.3, 0.62, 6.9]} radius={0.18} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#8a5638" roughness={0.62} metalness={0} bumpMap={leather} bumpScale={0.04} clearcoat={0.12} clearcoatRoughness={0.5} />
        </RoundedBox>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]}>
          <planeGeometry args={[8.6, 6.2]} />
          <meshBasicMaterial map={blob} transparent depthWrite={false} opacity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

export function OpeningScene() {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const card = useRef<THREE.Group>(null)
  const heroShadow = useRef<THREE.Mesh>(null)
  const heroShadowMat = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const lightTarget = useMemo(() => new THREE.Object3D(), [])
  const size = useThree((s) => s.size)
  const print = useHeroPrint()
  const glow = useMemo(() => ({ v: 0.4 }), [])
  const blob = useMemo(() => blobTexture(), [])
  const ready = useRef(false)
  useEffect(() => () => blob.dispose(), [blob])

  useFrame((state) => {
    const camera = cam.current
    const width = size.width
    const height = size.height
    if (!camera || width < 2 || height < 2) return
    const mobile = width < 760
    const fraction = mobile ? 0.62 : width < 1100 ? 0.4 : 0.31
    const aspect = width / height
    const fov = 16
    const dist = CARD.w / (fraction * 2 * Math.tan((fov * Math.PI) / 360) * aspect)
    const visW = CARD.w / fraction
    const visH = visW / aspect
    const t = pose.cam
    const lay = t * t * (3 - 2 * t)
    const cardX = mobile ? 0 : visW * 0.15
    const cardY = mobile ? 0 : 0.15
    const trayX = mobile ? 0 : 3.4
    hero.set(cardX, cardY, 0)
    slot.set(trayX - 0.6, TRAY_Y + 0.46 + pose.settle, -2.4)
    const cardPos = hero.lerp(slot, lay)
    look.set(cardX - (mobile ? 0 : visW * 0.03), cardY, 0)
    lookT.set(trayX, TRAY_Y + 0.5, 0.2)
    look.lerp(lookT, t)
    const elev = THREE.MathUtils.lerp(0.07, 1.34, t)
    const distNow = THREE.MathUtils.lerp(dist, mobile ? 36 : 64, t)
    camPos.set(look.x, look.y + Math.sin(elev) * distNow, look.z + Math.cos(elev) * distNow)
    camera.position.copy(camPos)
    camera.lookAt(look)
    camera.fov = THREE.MathUtils.lerp(fov, 24, t)
    camera.updateProjectionMatrix()

    const g = card.current
    if (g) {
      g.position.copy(cardPos)
      g.rotation.order = 'YXZ'
      g.rotation.y = pose.spin + pose.tiltY * (1 - lay) - 0.14 * lay
      g.rotation.x = pose.tiltX * (1 - lay) - (Math.PI / 2) * lay
      g.rotation.z = -0.04 * lay
    }
    if (light.current) {
      light.current.position.set(cardPos.x - 8, cardPos.y + 16, cardPos.z + 10)
      lightTarget.position.copy(cardPos)
      lightTarget.updateMatrixWorld()
    }
    const shade = heroShadow.current
    const shadeMat = heroShadowMat.current
    if (shade && shadeMat) {
      const facing = Math.abs(Math.cos(pose.spin))
      shade.position.set(cardPos.x + 0.7 * (1 - lay), cardPos.y - (2.15 + facing * 0.45) * (1 - lay), -0.9)
      shade.scale.set(3.1 + facing * 2.8, 1.15 + facing * 2.1, 1)
      shadeMat.opacity = (0.28 + facing * 0.22) * (1 - Math.min(1, t * 1.4))
      shade.visible = t < 0.92
    }
    const heroIdle = t < 0.2 && pose.spinning < 0.5
    glow.v = heroIdle ? 0.45 + Math.sin(state.clock.elapsedTime * 1.35) * 0.2 : Math.max(0, 0.85 - t * 1.1)
    if (!ready.current) {
      ready.current = true
      signals.onReady()
    }
  })

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={16} near={0.05} far={400} position={[0, 1, 40]} />
      <StudioEnv />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={light}
        target={lightTarget}
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={6}
        shadow-camera-near={2}
        shadow-camera-far={80}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <primitive object={lightTarget} />
      <directionalLight position={[6, 4, 8]} intensity={0.45} />
      <mesh ref={heroShadow} position={[0, -1.2, -0.6]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={heroShadowMat} map={blob} transparent depthWrite={false} opacity={0.3} />
      </mesh>
      <group position={[3.4, TRAY_Y, 0]}>
        <Tray />
        <Carry blob={blob} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <planeGeometry args={[40, 30]} />
          <shadowMaterial transparent opacity={0.16} />
        </mesh>
      </group>
      <group ref={card}>
        <ProductCard print={print} glow={glow} />
      </group>
    </>
  )
}
