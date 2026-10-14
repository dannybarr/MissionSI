import { useEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useExact, useFlatMaterial, useShading } from './materials';
import { USBC } from './outline';

/** Rounded-capsule cross-section in (u = card z, v = card y): hu tall across the thickness, wv wide along the edge. */
export function capsuleShape(wv: number, hu: number): THREE.Shape {
  const r = hu / 2;
  const hv = wv / 2 - r;
  const s = new THREE.Shape();
  s.moveTo(-r, -hv);
  s.lineTo(-r, hv);
  s.absarc(0, hv, r, Math.PI, 0, true);
  s.lineTo(r, -hv);
  s.absarc(0, -hv, r, 0, -Math.PI, true);
  return s;
}

/**
 * Geometry whose extrusion runs from x = xEdge inward (-x) by `depth`, capsule centred on (y = 0, z = zc).
 * Shape (u, v, e) maps to card (xEdge - e, v, zc + u).
 */
export function inwardExtrude(shape: THREE.Shape, depth: number, xEdge: number, zc: number, bevel = 0): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 14,
    steps: 1,
  });
  geo.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
  geo.translate(xEdge, 0, zc);
  return geo;
}

interface Props {
  /** x of the outer right edge at the socket (mm, card coords) */
  xEdge: number;
  /** socket centre across the thickness (mm, card coords) */
  zc: number;
  active: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}

const TONGUE = { len: 4.4, w: 6.6, t: 0.66 };
const PITCH = 0.5;

/**
 * Female USB-C receptacle sitting in the real cavity cut through the rim: steel shell lining the capsule
 * opening, dark back wall, central insulating tongue with 12 contacts on each face (concept, not certified).
 */
export function UsbCPort({ xEdge, zc, active, onPointerDown }: Props) {
  const steel = useFlatMaterial('#a9adb2', 0.28, 0.95);
  const dark = useFlatMaterial('#141517', 0.6, 0.1);
  const goldPbr = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#d9be7a', metalness: 1, roughness: 0.22, clearcoat: 0.3 }), []);
  useEffect(() => () => goldPbr.dispose(), [goldPbr]);
  const goldExact = useExact('#d9be7a');
  const gold = useShading() === 'accurate' ? goldExact : goldPbr;

  const parts = useMemo(() => {
    const D = USBC.depth;
    const lip = 0.06; // shell sits a hair inside the edge
    const outer = capsuleShape(USBC.w, USBC.h);
    outer.holes.push(new THREE.Path(capsuleShape(USBC.w - 0.18, USBC.h - 0.18).getPoints(14).reverse()));
    const shell = inwardExtrude(outer, D - 0.2 - lip, xEdge - lip, zc);
    const wall = inwardExtrude(capsuleShape(USBC.w, USBC.h), 0.2, xEdge - D + 0.2, zc);
    const tx = xEdge - D + 0.2 + TONGUE.len / 2;
    const tongue = new THREE.BoxGeometry(TONGUE.len, TONGUE.w, TONGUE.t);
    tongue.translate(tx, 0, zc);
    const pins: THREE.BufferGeometry[] = [];
    const cl = 3.2;
    const cx = xEdge - D + 0.2 + TONGUE.len - 0.35 - cl / 2;
    for (const face of [1, -1]) {
      for (let i = 0; i < 12; i++) {
        const b = new THREE.BoxGeometry(cl, 0.25, 0.04);
        b.translate(cx, (i - 5.5) * PITCH, zc + face * (TONGUE.t / 2 + 0.02));
        pins.push(b);
      }
    }
    const contacts = mergeGeometries(pins) ?? new THREE.BufferGeometry();
    pins.forEach((p) => p.dispose());
    return { shell, wall, tongue, contacts };
  }, [xEdge, zc]);
  useEffect(() => () => Object.values(parts).forEach((p) => p.dispose()), [parts]);

  return (
    <group name="USB-C port">
      <mesh name="USB-C shell" geometry={parts.shell} material={steel} onPointerDown={onPointerDown}>
        {active && <Edges threshold={30} color="#ff6a2b" lineWidth={2} depthTest={false} userData={{ helper: true }} />}
      </mesh>
      <mesh name="USB-C back wall" geometry={parts.wall} material={dark} onPointerDown={onPointerDown} />
      <mesh name="USB-C tongue" geometry={parts.tongue} material={dark} onPointerDown={onPointerDown} />
      <mesh name="USB-C contacts" geometry={parts.contacts} material={gold} onPointerDown={onPointerDown} />
    </group>
  );
}
