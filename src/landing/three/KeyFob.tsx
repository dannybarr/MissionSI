import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/** Olive rubber fob, chrome nose, embossed script, gold ring and shield. Centimetres, lying flat, nose toward -Z. */
export function KeyFob() {
  const mats = useMemo(() => {
    const script = scriptTexture()
    const crest = crestTexture()
    const rubber = new THREE.MeshPhysicalMaterial({
      color: '#5c6056',
      roughness: 0.78,
      metalness: 0.02,
      clearcoat: 0.04,
      clearcoatRoughness: 0.75,
    })
    const chrome = new THREE.MeshPhysicalMaterial({
      color: '#e4e7ec',
      metalness: 1,
      roughness: 0.12,
      envMapIntensity: 1.5,
      clearcoat: 0.4,
      clearcoatRoughness: 0.12,
    })
    const gold = new THREE.MeshPhysicalMaterial({ color: '#c6a24a', metalness: 1, roughness: 0.22, envMapIntensity: 1.3 })
    const scriptMat = new THREE.MeshBasicMaterial({ map: script, transparent: true, depthWrite: false })
    const shield = new THREE.MeshBasicMaterial({ map: crest, transparent: true, depthWrite: false })
    return { script, crest, rubber, chrome, gold, scriptMat, shield }
  }, [])

  const shieldGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 8 })
    g.translate(0, 0, -0.05)
    return g
  }, [])

  useEffect(
    () => () => {
      mats.script.dispose()
      mats.crest.dispose()
      mats.rubber.dispose()
      mats.chrome.dispose()
      mats.gold.dispose()
      mats.scriptMat.dispose()
      mats.shield.dispose()
      shieldGeo.dispose()
    },
    [mats, shieldGeo],
  )

  return (
    <group>
      <RoundedBox args={[2.45, 0.9, 4.2]} radius={0.42} smoothness={5} position={[0, 0, 1.0]} castShadow receiveShadow>
        <primitive object={mats.rubber} attach="material" />
      </RoundedBox>
      <RoundedBox args={[2.45, 0.9, 2.15]} radius={0.42} smoothness={5} position={[0, 0, -1.75]} castShadow>
        <primitive object={mats.chrome} attach="material" />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.06, 0.38]} radius={0.04} position={[0.22, 0.48, -0.72]} castShadow>
        <meshPhysicalMaterial color="#c5c8ce" roughness={0.28} metalness={0.85} />
      </RoundedBox>
      <mesh position={[0, 0.48, 1.15]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.7, 0.48]} />
        <primitive object={mats.scriptMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.02, -3.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.55, 0.08, 16, 36]} />
        <primitive object={mats.gold} attach="material" />
      </mesh>
      <group position={[-1.05, -0.32, -4.05]} rotation={[-Math.PI / 2, 0, 0.55]}>
        <mesh geometry={shieldGeo} scale={1.08}>
          <meshPhysicalMaterial color="#d4b15a" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[1.35, 2.05]} />
          <primitive object={mats.shield} attach="material" />
        </mesh>
      </group>
    </group>
  )
}

function scriptTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 180
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 512, 180)
  ctx.fillStyle = '#1c1e1a'
  ctx.font = 'italic 92px "Liberation Serif", "DejaVu Serif", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Lamborghini', 256, 96)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function shieldShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 1.05)
  s.bezierCurveTo(0.55, 1.02, 0.72, 0.72, 0.72, 0.42)
  s.lineTo(0.72, -0.15)
  s.bezierCurveTo(0.72, -0.62, 0.42, -0.95, 0, -1.22)
  s.bezierCurveTo(-0.42, -0.95, -0.72, -0.62, -0.72, -0.15)
  s.lineTo(-0.72, 0.42)
  s.bezierCurveTo(-0.72, 0.72, -0.55, 1.02, 0, 1.05)
  return s
}

function crestTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 256, 320)
  ctx.fillStyle = '#111113'
  ctx.beginPath()
  ctx.moveTo(128, 16)
  ctx.bezierCurveTo(214, 22, 232, 72, 232, 112)
  ctx.lineTo(232, 170)
  ctx.bezierCurveTo(232, 236, 188, 276, 128, 308)
  ctx.bezierCurveTo(68, 276, 24, 236, 24, 170)
  ctx.lineTo(24, 112)
  ctx.bezierCurveTo(24, 72, 42, 22, 128, 16)
  ctx.fill()
  ctx.strokeStyle = '#d4b15a'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(128, 18)
  ctx.bezierCurveTo(210, 24, 228, 70, 228, 108)
  ctx.lineTo(228, 168)
  ctx.bezierCurveTo(228, 230, 190, 270, 128, 304)
  ctx.bezierCurveTo(66, 270, 28, 230, 28, 168)
  ctx.lineTo(28, 108)
  ctx.bezierCurveTo(28, 70, 46, 24, 128, 18)
  ctx.stroke()
  ctx.fillStyle = '#e6c56a'
  ctx.font = '700 22px Inter, "Liberation Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AUTOMOBILI', 128, 78)
  ctx.fillText('LAMBORGHINI', 128, 104)
  drawBull(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** A small charging bull, gold on the black shield. */
function drawBull(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#e6c56a'
  ctx.beginPath()
  ctx.moveTo(78, 230)
  ctx.quadraticCurveTo(70, 200, 96, 188)
  ctx.quadraticCurveTo(88, 168, 108, 160)
  ctx.lineTo(118, 148)
  ctx.quadraticCurveTo(130, 156, 124, 176)
  ctx.quadraticCurveTo(150, 168, 168, 186)
  ctx.quadraticCurveTo(188, 176, 196, 196)
  ctx.quadraticCurveTo(176, 210, 168, 232)
  ctx.lineTo(156, 248)
  ctx.quadraticCurveTo(140, 236, 128, 250)
  ctx.quadraticCurveTo(116, 232, 100, 246)
  ctx.closePath()
  ctx.fill()
}
