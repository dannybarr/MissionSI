import { useEffect, useMemo, useState } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Corner } from '@/studio/studio/resize';

export interface HandleSpec extends Corner {
  x: number;
  y: number;
}

const CURSOR = (c: Corner) => (c.sx === c.sy ? 'nesw-resize' : 'nwse-resize');

/**
 * Corner resize handles in face/model millimetres. Viewport-only helpers (userData.helper), so PNG and GLB
 * exports hide them. Drawn on top (no depth test); the invisible hit square is larger than the visible knob.
 */
export function CornerHandles({ handles, z, onDown, label }: { handles: HandleSpec[]; z: number; onDown: (e: ThreeEvent<PointerEvent>, c: Corner) => void; label: string }) {
  const { gl } = useThree();
  const [hover, setHover] = useState<number | null>(null);
  const mats = useMemo(
    () => ({
      hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
      ring: new THREE.MeshBasicMaterial({ color: '#ff6a2b', depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
      fill: new THREE.MeshBasicMaterial({ color: '#f6f4ef', depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
      fillHot: new THREE.MeshBasicMaterial({ color: '#ff6a2b', depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useEffect(() => () => void (gl.domElement.style.cursor = ''), [gl]);

  return (
    <group userData={{ helper: true }} position={[0, 0, z]} name={`${label} resize handles`}>
      {handles.map((h, i) => (
        <group key={`${h.sx}${h.sy}${i}`} position={[h.x, h.y, 0]}>
          <mesh
            name="Resize handle"
            material={mats.hit}
            renderOrder={1001}
            userData={{ resizeHandle: label, sx: h.sx, sy: h.sy }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              onDown(e, { sx: h.sx, sy: h.sy });
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover(i);
              gl.domElement.style.cursor = CURSOR(h);
            }}
            onPointerOut={() => {
              setHover((v) => (v === i ? null : v));
              if (!gl.domElement.hasPointerCapture?.(1)) gl.domElement.style.cursor = '';
            }}
          >
            <planeGeometry args={[3.6, 3.6]} />
          </mesh>
          <mesh material={mats.ring} renderOrder={1002} raycast={() => null}>
            <planeGeometry args={[1.7, 1.7]} />
          </mesh>
          <mesh material={hover === i ? mats.fillHot : mats.fill} renderOrder={1003} position={[0, 0, 0.01]} raycast={() => null}>
            <planeGeometry args={[1.05, 1.05]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
