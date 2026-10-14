import { forwardRef, useEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { CompId, Design, MarkSide } from '@/studio/studio/types';
import { backMaterial, shade } from '@/studio/studio/presets';
import { contourPath, outlinePoints, shapeFrom, specFrom, maxRecessFor, USBC, type Insets } from './outline';
import { useFlatMaterial, useMetal, useShading } from './materials';
import { MarkMesh } from './MarkMesh';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { capsuleShape, inwardExtrude, UsbCPort } from './UsbCPort';
import { microTextRaster } from './logoRaster';
import { CornerHandles, type HandleSpec } from './ResizeHandles';
import { geoHandleKind, type Corner, type GeoHandleKind } from '@/studio/studio/resize';

export const MM = 0.05; // scene units per millimetre

function extrude(shape: THREE.Shape, depth: number, bevel: number, profile: 'rounded' | 'chamfer') {
  return new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, depth),
    bevelEnabled: bevel > 0.005,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: profile === 'chamfer' ? 1 : 5,
    curveSegments: 6,
    steps: 1,
  });
}

const csg = new Evaluator();
csg.attributes = ['position', 'normal', 'uv'];
csg.useGroups = false;

/** Cut the USB-C socket opening (a real capsule tunnel) out of a layer whose mesh sits at z = meshZ. */
function cutSocket(geo: THREE.BufferGeometry, xEdge: number, zcLocal: number): THREE.BufferGeometry {
  const prism = inwardExtrude(capsuleShape(USBC.w, USBC.h), USBC.depth + 1.5, xEdge + 1.5, zcLocal);
  try {
    const a = new Brush(geo);
    const b = new Brush(prism);
    a.updateMatrixWorld();
    b.updateMatrixWorld();
    const out = csg.evaluate(a, b, SUBTRACTION).geometry;
    geo.dispose();
    return out;
  } catch {
    return geo; // never lose the card body if the boolean fails
  } finally {
    prism.dispose();
  }
}

function useDisposable<T extends { dispose: () => void }>(v: T): T {
  useEffect(() => () => v.dispose(), [v]);
  return v;
}

export interface MarkDragInfo {
  markId: string;
  side: MarkSide;
  /** model-space z (scene units / MM) of the plane the mark sits on */
  planeZ: number;
}

export interface MarkResizeInfo extends MarkDragInfo, Corner {
  hw: number;
  hh: number;
}
export interface GeoResizeInfo extends Corner {
  kind: GeoHandleKind;
  /** model-space z of the drag plane (card mid-plane) */
  planeZ: number;
}

/** Live alignment guide while dragging a mark: mm in that face's viewer coords; null axis = not snapped. */
export interface SnapGuide {
  side: MarkSide;
  x: number | null;
  y: number | null;
}

function GuideLines({ guide, w, h, z }: { guide: SnapGuide; w: number; h: number; z: number }) {
  return (
    <group userData={{ helper: true }}>
      {guide.x !== null && <Line points={[[guide.x, -h / 2 - 2, z], [guide.x, h / 2 + 2, z]]} color="#ff6a2b" lineWidth={1.2} dashed dashSize={1} gapSize={0.7} depthTest={false} />}
      {guide.y !== null && <Line points={[[-w / 2 - 2, guide.y, z], [w / 2 + 2, guide.y, z]]} color="#ff6a2b" lineWidth={1.2} dashed dashSize={1} gapSize={0.7} depthTest={false} />}
    </group>
  );
}

interface Props {
  snapGuide?: SnapGuide | null;
  design: Design;
  selected: CompId | null;
  selectedMark: string | null;
  interactive: boolean;
  onSelect?: (id: CompId) => void;
  onSelectMark?: (id: string) => void;
  onMarkDragStart?: (e: ThreeEvent<PointerEvent>, info: MarkDragInfo) => void;
  onMarkResizeStart?: (e: ThreeEvent<PointerEvent>, info: MarkResizeInfo) => void;
  onGeoResizeStart?: (e: ThreeEvent<PointerEvent>, info: GeoResizeInfo) => void;
}

/** Selection is a static signal-orange outline: it never touches the surface material or its colour. */
function SelEdges({ on }: { on: boolean }) {
  return on ? <Edges threshold={24} color="#ff6a2b" lineWidth={1.6} depthTest={false} userData={{ helper: true }} /> : null;
}

/** In colour-accurate mode unlit surfaces need drawn creases to read as form (not exported to GLB). */
function FormEdges({ color }: { color: string }) {
  return useShading() === 'accurate' ? <Edges threshold={24} color={color} lineWidth={1} userData={{ formEdge: true }} /> : null;
}

export const MissionCard = forwardRef<THREE.Group, Props>(function MissionCard(
  { design, selected, selectedMark, interactive, onSelect, onSelectMark, onMarkDragStart, onMarkResizeStart, onGeoResizeStart, snapGuide },
  ref,
) {
  const { geometry: g, components: C } = design;
  const vis = (id: CompId) => C[id].visible;

  const spec = useMemo(
    () => specFrom(g, { top: vis('topContour'), bottom: vis('bottomContour'), side: vis('sideContours') }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g, C.topContour.visible, C.bottomContour.visible, C.sideContours.visible],
  );

  const T = g.thickness;
  const zb = T * 0.6;
  const lipBottom = zb - 0.25;
  const portOn = vis('connector');
  // socket centred on the right edge (at the bottom of the right side contour) and on the thickness
  const xEdge = g.width / 2 - spec.side;
  const zc = T / 2;
  const inner = g.border + g.trim;

  const L = useMemo(() => {
    const c = Math.min(g.chamfer, zb / 2 - 0.05);
    const c2 = Math.max(0.04, Math.min(g.chamfer * 0.85, (T - lipBottom) / 2 - 0.03, g.border * 0.42));
    const c3 = Math.max(0.03, Math.min(0.3, g.trim * 0.36));
    const trimTop = T - 0.3;
    // recess is capped so the USB-C opening always stays hidden under both faces with solid wall
    const rd = Math.min(g.recessDepth, maxRecessFor(T));
    const rTop = Math.max(lipBottom + 0.12, T - rd - 0.16);
    const faceTop = Math.min(trimTop - 0.02, Math.max(rTop + 0.1, T - rd));
    const c4 = 0.14;
    const fIn = inner + g.faceMargin;
    const faceIns: Insets = { l: fIn + c4, t: fIn + c4, b: fIn + c4, r: fIn + c4 };
    const backIns: Insets = { l: fIn + c4, t: fIn + c4, b: fIn + c4, r: fIn + c4 };
    // the chassis is now the shared core between two mirrored builds: z in [T - zb, zb]
    const coreBottom = T - zb;
    const cc = Math.max(0.03, Math.min(c, (zb - coreBottom) / 2 - 0.05));
    return { c, c2, c3, trimTop, rTop, faceTop, c4, fIn, faceIns, backIns, coreBottom, cc };
  }, [g, T, zb, lipBottom, inner]);

  const chassisGeo = useDisposable(
    useMemo(
      () => cutSocket(extrude(shapeFrom(outlinePoints(spec, L.cc)), zb - L.coreBottom - 2 * L.cc, L.cc, g.chamferProfile), xEdge, zc - (L.coreBottom + L.cc)),
      [spec, L.cc, L.coreBottom, zb, g.chamferProfile, xEdge, zc],
    ),
  );
  const perimeterGeo = useDisposable(
    useMemo(
      () =>
        cutSocket(
          extrude(shapeFrom(outlinePoints(spec, L.c2), outlinePoints(spec, g.border - L.c2)), T - lipBottom - 2 * L.c2, L.c2, g.chamferProfile),
          xEdge,
          zc - (lipBottom + L.c2), // same local z for the mirrored back build, since zc = T / 2
        ),
      [spec, L.c2, g.border, T, lipBottom, g.chamferProfile, xEdge, zc],
    ),
  );
  const chamferGeo = useDisposable(
    useMemo(
      () =>
        cutSocket(
          extrude(shapeFrom(outlinePoints(spec, g.border - 0.05 + L.c3), outlinePoints(spec, inner - L.c3)), L.trimTop - lipBottom - 2 * L.c3, L.c3, g.chamferProfile),
          xEdge,
          zc - (lipBottom + L.c3),
        ),
      [spec, g.border, L.c3, inner, L.trimTop, lipBottom, g.chamferProfile, xEdge, zc],
    ),
  );
  const recessGeo = useDisposable(
    useMemo(() => cutSocket(extrude(shapeFrom(outlinePoints(spec, inner - 0.05)), L.rTop - lipBottom, 0, 'rounded'), xEdge, zc - lipBottom), [spec, inner, L.rTop, lipBottom, xEdge, zc]),
  );
  const faceGeo = useDisposable(
    useMemo(() => cutSocket(extrude(shapeFrom(outlinePoints(spec, L.faceIns)), L.faceTop - lipBottom - 2 * L.c4, L.c4, 'rounded'), xEdge, zc - (lipBottom + L.c4)), [spec, L.faceIns, L.faceTop, lipBottom, L.c4, xEdge, zc]),
  );

  const backFaceGeo = useDisposable(
    useMemo(() => cutSocket(extrude(shapeFrom(outlinePoints(spec, L.backIns)), L.faceTop - lipBottom - 2 * L.c4, L.c4, 'rounded'), xEdge, zc - (lipBottom + L.c4)), [spec, L.backIns, L.faceTop, lipBottom, L.c4, xEdge, zc]),
  );

  const bodyMat = useMetal(design.body);
  const backParams = backMaterial(design);
  const ownBackMat = useMetal(backParams);
  const backMat = backParams === design.body ? bodyMat : ownBackMat;
  const trimMat = useMetal(design.trim);
  const recessMat = useFlatMaterial(shade(design.trim.color, -0.62), 0.48, 0.85);
  const trimEdge = shade(design.trim.color, -0.35);
  const bodyEdge = shade(design.body.color, -0.3);


  const micro = useMemo(() => {
    const r = microTextRaster('MISSION  MS-01  /  DESIGNED IN STUDIO');
    const t = new THREE.CanvasTexture(r.canvas);
    t.colorSpace = THREE.NoColorSpace;
    return { r, t };
  }, []);
  useEffect(() => () => micro.t.dispose(), [micro]);
  const microMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  useEffect(() => () => microMat.dispose(), [microMat]);
  microMat.alphaMap = micro.t;
  microMat.color.set(shade(design.body.color, -0.32));

  const click = (id: CompId) => (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || !onSelect) return;
    if (e.delta > 4) return;
    e.stopPropagation();
    onSelect(id);
  };

  const faceRight = g.width / 2 - L.faceIns.r + L.c4;
  const faceBottom = -g.height / 2 + L.fIn;
  const microH = 1.05;
  const microW = microH * micro.r.aspect;

  const contourSel = selected === 'topContour' || selected === 'bottomContour' || selected === 'sideContours';
  const contourPts = useMemo(() => {
    if (!contourSel) return null;
    const which = selected === 'topContour' ? 'top' : selected === 'bottomContour' ? 'bottom' : 'side';
    const lines = [contourPath(spec, 0.05, which, T + 0.04), contourPath(spec, g.border, which, T + 0.04)];
    if (which === 'side') lines.push(contourPath(spec, 0.05, 'right', T + 0.04), contourPath(spec, g.border, 'right', T + 0.04));
    return lines;
  }, [contourSel, selected, spec, T, g.border]);

  const front = design.marks.filter((m) => m.side === 'front');
  const back = design.marks.filter((m) => m.side === 'back');
  const logoOn = vis('logo');
  const markDown = (id: string, side: MarkSide, planeZ: number) => (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || e.button !== 0) return;
    e.stopPropagation();
    onSelectMark?.(id);
    const mk = design.marks.find((m) => m.id === id);
    if (!C.logo.locked && mk && !mk.locked) onMarkDragStart?.(e, { markId: id, side, planeZ });
  };
  // The back is the front build mirrored through the card's mid-plane (z' = T - z): the same rims, trim,
  // recess and bevelled face, so its outer face sits at T - faceTop with real depth (no coplanar plate).
  const backFaceZ = T - L.faceTop;

  const markHandle = (m: (typeof design.marks)[number], side: MarkSide, planeZ: number) =>
    interactive && onMarkResizeStart && selectedMark === m.id && !m.locked && !C.logo.locked
      ? (e: ThreeEvent<PointerEvent>, c: Corner, hw: number, hh: number) => onMarkResizeStart(e, { markId: m.id, side, planeZ, ...c, hw, hh })
      : undefined;

  // card-level corner handles for the selected component (honouring its lock and the chassis lock for outline size)
  const geoKind = selected ? geoHandleKind(selected) : null;
  let geoHandles: { kind: GeoHandleKind; list: HandleSpec[] } | null = null;
  if (interactive && onGeoResizeStart && selected && typeof geoKind === 'string' && !C[selected].locked && C[selected].visible) {
    const W = g.width / 2;
    const H = g.height / 2;
    if (geoKind === 'outline' && !C.chassis.locked) {
      geoHandles = { kind: geoKind, list: [ { sx: -1, sy: 1, x: -W, y: H }, { sx: 1, sy: 1, x: W, y: H }, { sx: 1, sy: -1, x: W, y: -H }, { sx: -1, sy: -1, x: -W, y: -H } ] };
    } else if (geoKind === 'contourTop' || geoKind === 'contourBottom') {
      const top = geoKind === 'contourTop';
      const d = top ? spec.top : spec.bottom;
      const y = top ? H - d : -H + d;
      const sy = top ? -1 : 1;
      geoHandles = { kind: geoKind, list: [ { sx: -1, sy, x: spec.notchOffset - spec.notchHalf, y }, { sx: 1, sy, x: spec.notchOffset + spec.notchHalf, y } ] };
    } else if (geoKind === 'side') {
      const x = W - spec.side;
      const y = spec.sideHalf;
      geoHandles = { kind: geoKind, list: [ { sx: -1, sy: 1, x: -x, y }, { sx: 1, sy: 1, x, y }, { sx: 1, sy: -1, x, y: -y }, { sx: -1, sy: -1, x: -x, y: -y } ] };
    }
  }

  return (
    <group ref={ref} scale={MM} name="MissionCard">
      <group position={[0, 0, -T / 2]}>
        <mesh name="Main chassis" geometry={chassisGeo} material={trimMat} position={[0, 0, L.coreBottom + L.cc]} visible={vis('chassis')} castShadow receiveShadow onClick={click('chassis')}>
          <FormEdges color={trimEdge} />
          <SelEdges on={selected === 'chassis'} />
        </mesh>
        <mesh name="Outer perimeter" geometry={perimeterGeo} material={trimMat} position={[0, 0, lipBottom + L.c2]} visible={vis('perimeter')} castShadow receiveShadow onClick={click('perimeter')}>
          <FormEdges color={trimEdge} />
          <SelEdges on={selected === 'perimeter'} />
        </mesh>
        <mesh name="Chamfered edges" geometry={chamferGeo} material={trimMat} position={[0, 0, lipBottom + L.c3]} visible={vis('chamfer')} receiveShadow onClick={click('chamfer')}>
          <FormEdges color={trimEdge} />
          <SelEdges on={selected === 'chamfer'} />
        </mesh>
        <mesh name="Inner recessed panel" geometry={recessGeo} material={recessMat} position={[0, 0, lipBottom]} visible={vis('recess')} receiveShadow onClick={click('recess')}>
          <SelEdges on={selected === 'recess'} />
        </mesh>
        <mesh name="Front face" geometry={faceGeo} material={bodyMat} position={[0, 0, lipBottom + L.c4]} visible={vis('face')} receiveShadow onClick={click('face')}>
          <FormEdges color={bodyEdge} />
          <SelEdges on={selected === 'face'} />
        </mesh>
        <group name="Back build" position={[0, 0, T]} scale={[1, 1, -1]}>
          <mesh name="Back perimeter" geometry={perimeterGeo} material={trimMat} position={[0, 0, lipBottom + L.c2]} visible={vis('perimeter')} castShadow receiveShadow onClick={click('perimeter')}>
            <FormEdges color={trimEdge} />
            <SelEdges on={selected === 'perimeter'} />
          </mesh>
          <mesh name="Back chamfered edges" geometry={chamferGeo} material={trimMat} position={[0, 0, lipBottom + L.c3]} visible={vis('chamfer')} receiveShadow onClick={click('chamfer')}>
            <FormEdges color={trimEdge} />
            <SelEdges on={selected === 'chamfer'} />
          </mesh>
          <mesh name="Back recessed panel" geometry={recessGeo} material={recessMat} position={[0, 0, lipBottom]} visible={vis('recess')} receiveShadow onClick={click('recess')}>
            <SelEdges on={selected === 'recess'} />
          </mesh>
          <mesh name="Back face" geometry={backFaceGeo} material={backMat} position={[0, 0, lipBottom + L.c4]} visible={vis('back')} receiveShadow onClick={click('back')}>
            <FormEdges color={bodyEdge} />
            <SelEdges on={selected === 'back'} />
          </mesh>
        </group>

        {portOn && (
          <UsbCPort
            xEdge={xEdge}
            zc={zc}
            active={selected === 'connector'}
            onPointerDown={(e) => {
              if (!interactive || !onSelect || e.button !== 0) return;
              e.stopPropagation();
              onSelect('connector');
            }}
          />
        )}

        {vis('details') && vis('face') && (
          <group name="Surface details">
            <mesh material={microMat} position={[faceRight - microW / 2 - 2.2, faceBottom + 2.3, L.faceTop + 0.01]} onClick={click('details')}>
              <planeGeometry args={[microW, microH]} />
            </mesh>
            <mesh material={trimMat} position={[faceRight - 3.2, g.height / 2 - L.fIn - 3.2, L.faceTop + 0.02]} onClick={click('details')}>
              <torusGeometry args={[0.55, 0.12, 12, 40]} />
              <SelEdges on={selected === 'details'} />
            </mesh>
          </group>
        )}

        {logoOn && vis('face') && (
          <group name="Front branding" position={[0, 0, L.faceTop]}>
            {front.map((m) => (
              <MarkMesh key={m.id} mark={m} body={design.body} active={selectedMark === m.id} onPointerDown={markDown(m.id, 'front', L.faceTop - T / 2)} onHandleDown={markHandle(m, 'front', L.faceTop - T / 2 + 0.04)} />
            ))}
            {snapGuide?.side === 'front' && <GuideLines guide={snapGuide} w={g.width} h={g.height} z={0.2} />}
          </group>
        )}
        {logoOn && (
          /* rotated half a turn about Y: mark x is the viewer's right when looking at the back */
          <group name="Back branding" position={[0, 0, backFaceZ]} rotation={[0, Math.PI, 0]} visible={vis('back')}>
            {back.map((m) => (
              <MarkMesh key={m.id} mark={m} body={backParams} active={selectedMark === m.id} onPointerDown={markDown(m.id, 'back', backFaceZ - T / 2)} onHandleDown={markHandle(m, 'back', backFaceZ - T / 2 - 0.04)} />
            ))}
            {snapGuide?.side === 'back' && <GuideLines guide={snapGuide} w={g.width} h={g.height} z={0.2} />}
          </group>
        )}

        {geoHandles && (
          <CornerHandles
            label={selected ?? 'card'}
            z={T / 2}
            handles={geoHandles.list}
            onDown={(e, c) => onGeoResizeStart?.(e, { kind: geoHandles!.kind, planeZ: 0, ...c })}
          />
        )}
        {contourPts && (
          <group userData={{ helper: true }}>
            {contourPts.map((pts, i) => (
              <Line key={i} points={pts} color="#ff6a2b" lineWidth={2} transparent opacity={0.95} depthTest={false} />
            ))}
          </group>
        )}
      </group>
    </group>
  );
});
