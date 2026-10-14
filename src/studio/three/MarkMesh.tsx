import { useEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { BrandMark, MaterialParams } from '@/studio/studio/types';
import { shade } from '@/studio/studio/presets';
import { SVG_H_RATIO, TEXT_H_RATIO, useMarkRaster, type LogoRaster } from './logoRaster';
import { useShading } from './materials';
import { CornerHandles } from './ResizeHandles';
import type { Corner } from '@/studio/studio/resize';

/** Real relief: a displaced grid whose vertices are lifted by the mark's alpha coverage. */
function reliefGeometry(r: LogoRaster, w: number, h: number, depth: number): THREE.BufferGeometry {
  const sx = Math.min(360, Math.max(60, Math.round(w * 9)));
  const sy = Math.min(200, Math.max(24, Math.round(h * 9)));
  const geo = new THREE.PlaneGeometry(w, h, sx, sy);
  const sw = sx + 1;
  const sh = sy + 1;
  const tmp = document.createElement('canvas');
  tmp.width = sw;
  tmp.height = sh;
  const ctx = tmp.getContext('2d')!;
  ctx.drawImage(r.canvas, 0, 0, sw, sh);
  const data = ctx.getImageData(0, 0, sw, sh).data;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let j = 0; j < sh; j++) {
    for (let i = 0; i < sw; i++) {
      const idx = j * sw + i; // PlaneGeometry rows run top -> bottom, same as canvas
      pos.setZ(idx, depth * Math.min(1, (data[idx * 4 + 3] / 255) * 1.15));
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Deterministic colour a mark shows for its finish (same rule in both shading modes). */
export function markColor(m: BrandMark, body: MaterialParams): string {
  if (m.finish !== 'engraved') return m.color;
  if (m.laser === 'frost') return shade(body.color, 0.35);
  if (m.laser === 'anneal') return '#1b1c1f';
  return shade(body.color, 0.1);
}

export function markPlaneSize(m: BrandMark, aspect: number) {
  const h = m.size * (m.kind === 'text' ? TEXT_H_RATIO : SVG_H_RATIO);
  return { w: h * aspect, h };
}

interface Props {
  mark: BrandMark;
  body: MaterialParams;
  active: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  /** Present when the mark is selected and resizable: corner handles appear. hw/hh = half plane size (mm). */
  onHandleDown?: (e: ThreeEvent<PointerEvent>, c: Corner, hw: number, hh: number) => void;
}

/** One branding mark in face-local millimetres (parent group handles front/back mirroring). */
export function MarkMesh({ mark: m, body, active, onPointerDown, onHandleDown }: Props) {
  const mode = useShading();
  const raster = useMarkRaster(m);

  const tex = useMemo(() => {
    if (!raster) return null;
    const t = new THREE.CanvasTexture(raster.canvas);
    t.anisotropy = 8;
    // photo marks carry real sRGB colour; masks are linear coverage only
    t.colorSpace = raster.color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return t;
  }, [raster]);
  useEffect(() => () => tex?.dispose(), [tex]);

  const { w, h } = markPlaneSize(m, raster?.aspect ?? 1);
  const relief = m.finish === 'embossed' && m.depth > 0.001;

  const geo = useMemo(() => {
    if (!raster) return null;
    return relief ? reliefGeometry(raster, w, h, m.depth) : new THREE.PlaneGeometry(w, h);
  }, [raster, relief, w, h, m.depth]);
  useEffect(() => () => geo?.dispose(), [geo]);

  const basic = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, alphaTest: 0.42, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  const lit = useMemo(() => new THREE.MeshStandardMaterial({ alphaTest: 0.42, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  useEffect(() => () => basic.dispose(), [basic]);
  useEffect(() => () => lit.dispose(), [lit]);

  const photo = !!raster?.color;
  const color = photo ? '#ffffff' : markColor(m, body);
  for (const mat of [basic, lit]) {
    const map = photo ? tex : null;
    const alphaMap = photo ? null : tex;
    // photo marks keep soft source edges (corona, ring edges): blended, not alpha-tested at 0.42
    const alphaTest = photo ? 0.004 : 0.42;
    if (mat.alphaMap !== alphaMap || mat.map !== map || mat.transparent !== photo || mat.alphaTest !== alphaTest) {
      mat.alphaMap = alphaMap;
      mat.map = map;
      mat.transparent = photo;
      mat.depthWrite = !photo;
      mat.alphaTest = alphaTest;
      mat.needsUpdate = true;
    }
    mat.color.set(color);
  }
  if (photo) {
    lit.roughness = 0.55; // printed photo ink
    lit.metalness = 0;
  } else if (m.finish === 'printed') {
    lit.roughness = 0.62;
    lit.metalness = 0;
  } else if (m.finish === 'engraved') {
    lit.roughness = m.laser === 'frost' ? 0.92 : m.laser === 'anneal' ? 0.3 : 0.04;
    lit.metalness = m.laser === 'frost' ? 0.45 : m.laser === 'anneal' ? 0.9 : 1;
  } else {
    lit.roughness = Math.max(0.12, body.roughness * 0.6);
    lit.metalness = body.metalness;
  }

  const outline = useMemo(() => {
    const x = w / 2 + 0.4;
    const y = h / 2 + 0.2;
    return [
      [-x, -y, 0.05],
      [x, -y, 0.05],
      [x, y, 0.05],
      [-x, y, 0.05],
      [-x, -y, 0.05],
    ] as [number, number, number][];
  }, [w, h]);

  if (!raster || !geo || !m.visible) return null;
  return (
    <group position={[m.x, m.y, 0.04]} rotation={[0, 0, (m.rotation * Math.PI) / 180]}>
      <mesh
        name={`Mark ${m.name}`}
        geometry={geo}
        material={mode === 'accurate' ? basic : lit}
        onPointerDown={onPointerDown}
        // the click that follows a mark pointer-down must not fall through and select the face underneath
        onClick={(e) => e.stopPropagation()}
        castShadow={relief && mode === 'studio'}
        userData={{ markId: m.id }}
      />
      {active && (
        <group userData={{ helper: true }}>
          <Line points={outline} color="#ff6a2b" lineWidth={1.5} dashed dashSize={0.8} gapSize={0.5} depthTest={false} />
        </group>
      )}
      {active && onHandleDown && (
        <CornerHandles
          label="Mark"
          z={0.12}
          handles={[
            { sx: -1, sy: 1, x: -w / 2, y: h / 2 },
            { sx: 1, sy: 1, x: w / 2, y: h / 2 },
            { sx: 1, sy: -1, x: w / 2, y: -h / 2 },
            { sx: -1, sy: -1, x: -w / 2, y: -h / 2 },
          ]}
          onDown={(e, c) => onHandleDown(e, c, w / 2, h / 2)}
        />
      )}
    </group>
  );
}
