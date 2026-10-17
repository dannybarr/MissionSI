import { useEffect, useMemo } from 'react'
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

export function ProductCard({ print, glow: _glow }: { print: THREE.Texture | null; glow: { v: number } }) {
  const geos = useMemo(() => cardGeometries(), [])
  const mats = useMemo(() => {
    const rough = beadTexture()
    const body = new THREE.MeshPhysicalMaterial({
      color: '#2c2e33',
      metalness: 0.92,
      roughness: 0.46,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.01,
      envMapIntensity: 0.65,
      clearcoat: 0.16,
      clearcoatRoughness: 0.42,
    })
    const face = new THREE.MeshPhysicalMaterial({
      color: '#121416',
      metalness: 1,
      roughness: 0.82,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.008,
      envMapIntensity: 0.22,
    })
    const ink = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })
    const steel = new THREE.MeshPhysicalMaterial({ color: '#c5c9ce', metalness: 1, roughness: 0.22, envMapIntensity: 1.4 })
    const dark = new THREE.MeshStandardMaterial({ color: '#101113', roughness: 0.72, metalness: 0.15 })
    const gold = new THREE.MeshPhysicalMaterial({ color: '#d4b56e', metalness: 1, roughness: 0.24 })
    return { rough, body, face, ink, steel, dark, gold }
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
      mats.rough.dispose()
    },
    [backPanel, mats],
  )

  if (print && mats.ink.map !== print) {
    mats.ink.map = print
    mats.ink.needsUpdate = true
  }

  const plane = { w: CARD.w - PRINT.inset * 2, h: CARD.h - PRINT.inset * 2 }

  return (
    <group>
      <mesh geometry={geos.body} material={mats.body} castShadow receiveShadow />
      <mesh geometry={geos.panel} material={mats.face} receiveShadow />
      <mesh geometry={backPanel} material={mats.face} receiveShadow />
      {print && (
        <mesh position={[0, 0, geos.faceZ + 0.02]} material={mats.ink}>
          <planeGeometry args={[plane.w, plane.h]} />
        </mesh>
      )}
      <mesh geometry={geos.shell} material={mats.steel} />
      <mesh geometry={geos.cavity} material={mats.dark} />
      <mesh geometry={geos.tongue} material={mats.dark} />
      <mesh geometry={geos.pins} material={mats.gold} />
    </group>
  )
}
