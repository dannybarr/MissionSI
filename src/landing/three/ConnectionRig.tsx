import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { pose } from './pose'
import { CARD } from './geometry'

const MOUTH = -CARD.w / 2 + 0.17

/** Tabletop is the card's local XY plane. Cable and sockets share this frame. */
export function ConnectionRig() {
  const group = useRef<THREE.Group>(null)
  const plug = useRef<THREE.Group>(null)
  const wire = useRef<THREE.Mesh>(null)
  const lastGap = useRef(-1)
  const materials = useRef<THREE.Material[]>([])
  const data = useMemo(() => {
    const points = [
      new THREE.Vector3(-9.9, 1.6, 0),
      new THREE.Vector3(-8.7, 1.6, -0.06),
      new THREE.Vector3(-8.4, -2.7, -0.12),
      new THREE.Vector3(-6.4, -3.1, -0.1),
      new THREE.Vector3(-5.9, -0.5, 0),
      new THREE.Vector3(MOUTH - 1.15, 0, 0),
    ]
    const curve = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.TubeGeometry(curve, 80, 0.065, 8, false)
    const original = Float32Array.from(geometry.attributes.position.array)
    return { geometry, original }
  }, [])
  useEffect(() => () => data.geometry.dispose(), [data])
  useEffect(() => {
    group.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const list = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of list) {
          material.transparent = true
          materials.current.push(material)
        }
      }
    })
    return () => { materials.current = [] }
  }, [])
  useFrame(() => {
    if (!group.current || !plug.current || !wire.current) return
    group.current.visible = pose.connection > 0.002
    for (const material of materials.current) material.opacity = pose.connection
    if (!group.current.visible) return
    // Withdraw the connector along its insertion axis, keeping the laptop end fixed.
    const gap = (1 - pose.insertion) * 0.62
    if (Math.abs(gap - lastGap.current) < 0.00001) return
    lastGap.current = gap
    plug.current.position.x = MOUTH - gap
    const attr = data.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < attr.count; i++) {
      const u = Math.floor(i / 9) / 80
      const weight = u * u * (3 - 2 * u)
      attr.setX(i, data.original[i * 3]! - gap * weight)
    }
    attr.needsUpdate = true
    data.geometry.computeVertexNormals()
  })
  return (
    <group ref={group} visible={false}>
      <mesh ref={wire} geometry={data.geometry} castShadow>
        <meshStandardMaterial color="#eeeae2" roughness={0.72} metalness={0.02} />
      </mesh>
      <group ref={plug}>
        <RoundedBox args={[0.72, 0.53, 0.31]} radius={0.1} position={[-0.68, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#f4f1ea" roughness={0.36} clearcoat={0.15} />
        </RoundedBox>
        <RoundedBox args={[0.36, 0.69, 0.22]} radius={0.07} position={[-0.15, 0, 0]}>
          <meshStandardMaterial color="#b9bdc0" metalness={0.95} roughness={0.25} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.18, 0.18]} radius={0.07} position={[-1.1, 0, 0]}>
          <meshStandardMaterial color="#e9e5dd" roughness={0.65} />
        </RoundedBox>
      </group>
      <group position={[-15.8, 2.3, -0.38]}>
        <RoundedBox args={[11, 7.5, 0.44]} radius={0.18} castShadow receiveShadow>
          <meshStandardMaterial color="#55585c" metalness={0.83} roughness={0.36} />
        </RoundedBox>
        <RoundedBox args={[3.8, 2.2, 0.025]} radius={0.09} position={[0, -2.05, 0.235]}>
          <meshStandardMaterial color="#62666b" metalness={0.7} roughness={0.44} />
        </RoundedBox>
        {Array.from({ length: 5 }, (_, row) => Array.from({ length: 13 }, (_, col) => (
          <mesh key={`${row}-${col}`} position={[(col - 6) * 0.7, row * 0.58 - 0.4, 0.245]}>
            <boxGeometry args={[0.61, 0.47, 0.04]} />
            <meshStandardMaterial color="#17191b" roughness={0.65} />
          </mesh>
        )))}
        <group position={[0, 3.55, 0]} rotation={[0.45, 0, 0]}>
          <RoundedBox args={[11, 5.2, 0.18]} radius={0.15} position={[0, 2.6, 0]} castShadow>
            <meshStandardMaterial color="#3b3e42" metalness={0.8} roughness={0.37} />
          </RoundedBox>
          <mesh position={[0, 2.6, 0.1]}>
            <planeGeometry args={[10.5, 4.65]} />
            <meshStandardMaterial color="#151d24" roughness={0.24} metalness={0.12} />
          </mesh>
        </group>
        <RoundedBox args={[0.05, 0.79, 0.27]} radius={0.06} position={[5.52, -0.7, 0.25]}>
          <meshStandardMaterial color="#101112" roughness={0.65} />
        </RoundedBox>
        <RoundedBox args={[0.48, 0.48, 0.3]} radius={0.08} position={[5.72, -0.7, 0.38]}>
          <meshStandardMaterial color="#efebe4" roughness={0.45} />
        </RoundedBox>
      </group>
    </group>
  )
}
