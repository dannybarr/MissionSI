import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CARD, cardGeometries } from './geometry'
import { PRINT } from './print'

function beadTexture() {
  const c = document.createElement('canvas')
  const size = 256
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  let s = 1337
  const rand = () => {
    s = (Math.imul(s, 16807) + 11) >>> 0
    return s / 4294967296
  }
  for (let i = 0; i < size * size; i++) {
    const n = 176 + (rand() - 0.5) * 78
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = n
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(5, 3.4)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 4
  return tex
}

export function ProductCard({ print, glow }: { print: THREE.Texture | null; glow: { v: number } }) {
  const geos = useMemo(() => cardGeometries(), [])
  const lamp = useRef<THREE.PointLight>(null)
  const mats = useMemo(() => {
    const rough = beadTexture()
    const body = new THREE.MeshPhysicalMaterial({
      color: '#3c3e43',
      metalness: 1,
      roughness: 0.46,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.015,
      envMapIntensity: 0.9,
      clearcoat: 0.12,
      clearcoatRoughness: 0.35,
    })
    const face = new THREE.MeshPhysicalMaterial({
      color: '#32343a',
      metalness: 1,
      roughness: 0.68,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.01,
      envMapIntensity: 0.55,
    })
    const ink = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0.05,
      roughness: 0.58,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      envMapIntensity: 0.25,
    })
    const steel = new THREE.MeshPhysicalMaterial({ color: '#b7bcc2', metalness: 1, roughness: 0.32, envMapIntensity: 1.1 })
    const dark = new THREE.MeshStandardMaterial({ color: '#101113', roughness: 0.72, metalness: 0.15 })
    const gold = new THREE.MeshPhysicalMaterial({ color: '#d4b56e', metalness: 1, roughness: 0.24 })
    const led = new THREE.MeshPhysicalMaterial({
      color: '#dbe4ee',
      emissive: new THREE.Color('#e9f3ff'),
      emissiveIntensity: 0.2,
      roughness: 0.18,
      metalness: 0,
    })
    return { rough, body, face, ink, steel, dark, gold, led }
  }, [])

  const backPanel = useMemo(() => {
    const g = geos.panel.clone()
    g.scale(1, 1, -1)
    g.computeVertexNormals()
    return g
  }, [geos])

  useEffect(
    () => () => {
      backPanel.dispose()
      mats.body.dispose()
      mats.face.dispose()
      mats.ink.dispose()
      mats.steel.dispose()
      mats.dark.dispose()
      mats.gold.dispose()
      mats.led.dispose()
      mats.rough.dispose()
    },
    [backPanel, mats],
  )

  if (print && mats.ink.map !== print) {
    mats.ink.map = print
    mats.ink.needsUpdate = true
  }

  useFrame(() => {
    mats.led.emissiveIntensity = 0.12 + glow.v * 2.6
    if (lamp.current) lamp.current.intensity = glow.v * 0.35
  })

  const plane = { w: CARD.w - PRINT.inset * 2, h: CARD.h - PRINT.inset * 2 }

  return (
    <group>
      <mesh geometry={geos.body} material={mats.body} castShadow receiveShadow />
      <mesh geometry={geos.panel} material={mats.face} receiveShadow />
      <mesh geometry={backPanel} material={mats.face} receiveShadow />
      {print && (
        <mesh position={[0, 0, geos.faceZ + 0.006]} material={mats.ink}>
          <planeGeometry args={[plane.w, plane.h]} />
        </mesh>
      )}
      <mesh geometry={geos.shell} material={mats.steel} />
      <mesh geometry={geos.cavity} material={mats.dark} />
      <mesh geometry={geos.tongue} material={mats.dark} />
      <mesh geometry={geos.pins} material={mats.gold} />
      <mesh position={[3.58, 2.12, geos.faceZ + 0.02]}>
        <sphereGeometry args={[0.07, 18, 12]} />
        <primitive object={mats.led} attach="material" />
        <pointLight ref={lamp} color="#d5e6ff" distance={2.4} decay={2} intensity={0} />
      </mesh>
    </group>
  )
}
