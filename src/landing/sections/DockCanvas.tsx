import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function Scene({ progress, reduced }: { progress: React.MutableRefObject<number>; reduced: boolean }) {
  const card = useRef<THREE.Group>(null)
  const clamp = useRef<THREE.Group>(null)
  const moonL = useRef<THREE.Mesh>(null)
  const moonR = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const p = reduced ? 1 : progress.current
    const lower = THREE.MathUtils.smoothstep(p, 0.02, 0.42)
    const shut = THREE.MathUtils.smoothstep(p, 0.34, 0.74)
    const lit = THREE.MathUtils.smoothstep(p, 0.7, 0.96)
    if (card.current) {
      card.current.position.y = THREE.MathUtils.lerp(1.35, 0.16, lower)
      card.current.rotation.z = THREE.MathUtils.lerp(-0.08, 0, lower)
    }
    if (clamp.current) {
      clamp.current.rotation.y = THREE.MathUtils.lerp(-1.15, 0, shut)
      clamp.current.position.x = THREE.MathUtils.lerp(-0.15, 0, shut)
    }
    const emissive = 0.15 + lit * 2.4
    const color = new THREE.Color().setRGB(0.55 + lit * 0.45, 0.5 + lit * 0.4, 0.38 + lit * 0.15)
    for (const m of [moonL.current, moonR.current]) {
      const mat = m?.material
      if (mat && 'emissive' in mat && mat.emissive instanceof THREE.Color) {
        mat.emissive.copy(color)
        mat.emissiveIntensity = emissive
      }
    }
    if (glow.current) glow.current.intensity = lit * 6
  })

  return (
    <>
      <color attach="background" args={['#141516']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <pointLight ref={glow} position={[0, 0.9, 0.4]} intensity={0} color="#f3e2bc" distance={4} />

      <RoundedBox args={[3.4, 0.28, 2.15]} radius={0.12} position={[0, -0.15, 0]} smoothness={4}>
        <meshStandardMaterial color="#8a8884" roughness={0.72} metalness={0.55} />
      </RoundedBox>
      <RoundedBox args={[2.5, 0.06, 1.55]} radius={0.06} position={[0, 0.02, 0]} smoothness={3}>
        <meshStandardMaterial color="#6e6c68" roughness={0.8} metalness={0.4} />
      </RoundedBox>

      <group ref={card} position={[0, 1.35, 0]}>
        <RoundedBox args={[2.15, 0.08, 1.36]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color="#17356f" roughness={0.42} metalness={0.35} />
        </RoundedBox>
        <mesh position={[0.72, 0.05, -0.28]}>
          <sphereGeometry args={[0.16, 24, 16]} />
          <meshStandardMaterial color="#8fb4d8" roughness={0.45} />
        </mesh>
      </group>

      <group ref={clamp} position={[0, 0.2, 0]}>
        <mesh position={[-1.15, 0, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.08, 0.06, 1.5]} />
          <meshStandardMaterial color="#9a9893" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh rotation={[0, 0, 0.55]} position={[0, 0.02, 0]}>
          <boxGeometry args={[2.3, 0.045, 0.09]} />
          <meshStandardMaterial color="#a19e98" metalness={0.65} roughness={0.38} />
        </mesh>
        <mesh rotation={[0, 0, -0.55]} position={[0, 0.02, 0]}>
          <boxGeometry args={[2.3, 0.045, 0.09]} />
          <meshStandardMaterial color="#8e8c87" metalness={0.65} roughness={0.38} />
        </mesh>
      </group>

      <mesh ref={moonL} position={[-0.09, 0.72, 0.15]} rotation={[Math.PI / 2.4, 0, 0]}>
        <circleGeometry args={[0.22, 32, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#8d8a84" emissive="#8d8a84" emissiveIntensity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={moonR} position={[0.09, 0.72, 0.15]} rotation={[Math.PI / 2.4, 0, Math.PI]}>
        <circleGeometry args={[0.22, 32, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#8d8a84" emissive="#8d8a84" emissiveIntensity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export default function DockCanvas({ progress, reduced }: { progress: React.MutableRefObject<number>; reduced: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [2.4, 2.1, 3.2], fov: 32 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      frameloop={reduced ? 'demand' : 'always'}
      aria-label="Scroll-driven view of the card seating in the dock, the clamp closing, and the moon lighting"
    >
      <Scene progress={progress} reduced={reduced} />
    </Canvas>
  )
}
