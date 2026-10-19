import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { CARD } from './geometry'
import { drawCardArt, printPlaneSize, setEtchReady } from './print'
import { ProductCard } from './ProductCard'
import { getTeaserArt, subscribeTeaserArt } from './teaserArt'

function useArtTexture() {
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
    const earth = new Image()
    earth.decoding = 'async'
    const draw = () => {
      if (!live) return
      const ctx = tex.c.getContext('2d')
      if (!ctx) return
      drawCardArt(ctx, tex.c.width, tex.c.height, getTeaserArt(), earth.complete ? earth : null)
      tex.t.needsUpdate = true
    }
    earth.onload = draw
    earth.src = '/assets/nasa/earth.webp'
    const off = subscribeTeaserArt(draw)
    setEtchReady(draw)
    document.fonts?.load('500 64px Handjet').then(draw).catch(() => {})
    draw()
    return () => {
      live = false
      off()
      setEtchReady(() => {})
      tex.t.dispose()
    }
  }, [tex])
  return tex.t
}

function TeaserCanvas() {
  const host = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(true)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOn(!!entry?.isIntersecting), { rootMargin: '180px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={host} style={{ width: '100%', height: '100%' }}>
      <Canvas
        frameloop={on ? 'always' : 'never'}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <TeaserScene />
      </Canvas>
    </div>
  )
}

export function mountTeaser(el: HTMLElement): Root {
  const root = createRoot(el)
  root.render(<TeaserCanvas />)
  return root
}

function TeaserScene() {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const size = useThree((s) => s.size)
  const print = useArtTexture()
  const glow = useMemo(() => ({ v: 0.2 }), [])
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = tex
    scene.environmentIntensity = 0.8
    return () => {
      scene.environment = null
      tex.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  useFrame(() => {
    const camera = cam.current
    if (!camera || size.width < 2) return
    const aspect = size.width / Math.max(1, size.height)
    const fov = 18
    const dist = CARD.w / (0.9 * 2 * Math.tan((fov * Math.PI) / 360) * aspect)
    camera.fov = fov
    camera.position.set(0, 0.05, dist)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  })

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={18} near={0.05} far={80} position={[0, 0, 20]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[-4, 7, 6]} intensity={2.4} />
      <directionalLight position={[5, 2, 4]} intensity={0.4} />
      <ProductCard print={print} glow={glow} />
    </>
  )
}
