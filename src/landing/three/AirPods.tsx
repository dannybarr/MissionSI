import { RoundedBox } from '@react-three/drei'

const gloss = { color: '#f7f7f5', roughness: 0.16, clearcoat: 0.85, clearcoatRoughness: 0.12, metalness: 0.02 } as const

/** Glossy white case and two buds, in centimetres. The case sits with its lid facing up. */
export function AirPods() {
  return (
    <group>
      <RoundedBox args={[5.4, 2.15, 4.55]} radius={0.85} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial {...gloss} />
      </RoundedBox>
      <mesh position={[0, 1.09, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.7, 0.04]} />
        <meshBasicMaterial color="#cfcfcb" />
      </mesh>
      <mesh position={[0, 1.1, 1.7]}>
        <sphereGeometry args={[0.055, 12, 8]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.4} />
      </mesh>
      <group position={[3.6, -0.42, 2.15]} rotation={[0.15, -0.9, Math.PI / 2]}>
        <Bud />
      </group>
      <group position={[2.4, -0.42, -2.7]} rotation={[-0.1, 0.5, Math.PI / 2]}>
        <Bud />
      </group>
    </group>
  )
}

function Bud() {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.62, 24, 16]} />
        <meshPhysicalMaterial {...gloss} />
      </mesh>
      <mesh position={[0.15, -0.15, 0.35]} rotation={[0.5, 0, 0.4]} castShadow>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshPhysicalMaterial color="#f3f3f1" roughness={0.35} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, -1.25, 0]} castShadow>
        <capsuleGeometry args={[0.2, 1.15, 8, 16]} />
        <meshPhysicalMaterial {...gloss} />
      </mesh>
      <mesh position={[0.24, -1.05, 0]} rotation={[0.3, 0, 0]}>
        <capsuleGeometry args={[0.12, 0.46, 8, 12]} />
        <meshStandardMaterial color="#141414" roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.55, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.12, 12]} />
        <meshPhysicalMaterial color="#d5d6d8" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  )
}
