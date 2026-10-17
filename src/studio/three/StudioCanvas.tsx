import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { CameraControls, ContactShadows, Grid, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { bridge } from '@/studio/studio/bridge';
import type { BrandMark, CompId, Design, GeometryParams, ViewPreset, ViewSettings } from '@/studio/studio/types';
import { resizeContour, resizeMark, resizeOutline, resizeSide } from '@/studio/studio/resize';
import { MissionCard, MM, type GeoResizeInfo, type MarkDragInfo, type MarkResizeInfo, type SnapGuide } from './MissionCard';
import { ShadingContext } from './materials';
import { StudioLights } from './StudioLights';
import { Guides } from './Guides';
import { detectWebGL, ViewportBoundary, ViewportUnavailable } from './webgl';

const ANGLES: Record<ViewPreset, [number, number]> = {
  front: [0, Math.PI / 2],
  back: [Math.PI, Math.PI / 2],
  side: [Math.PI / 2, Math.PI / 2],
  top: [0, 0.02],
  iso: [Math.PI / 4.2, 0.98],
};

interface Props {
  design: Design;
  view: ViewSettings;
  primary?: boolean;
  interactive?: boolean;
  turntable?: boolean;
  selected?: CompId | null;
  onSelect?: (id: CompId | null) => void;
  selectedMark?: string | null;
  onSelectMark?: (id: string) => void;
  onMarkMove?: (id: string, x: number, y: number) => void;
  presetSignal?: number;
  onMarkPatch?: (id: string, patch: Partial<BrandMark>) => void;
  onGeoPatch?: (patch: Partial<GeometryParams>) => void;
  /** begin / end / cancel one undoable gesture */
  onGesture?: (op: 'begin' | 'end' | 'cancel') => void;
}

const SNAP_MM = 1.2;
export function snapTo(v: number, targets: number[]): number {
  let best = v;
  let d = SNAP_MM;
  for (const t of targets) {
    const dd = Math.abs(v - t);
    if (dd < d) {
      d = dd;
      best = t;
    }
  }
  return best;
}

function Rig({ design, view, primary, interactive, turntable, selected, onSelect, selectedMark, onSelectMark, onMarkMove, presetSignal, onMarkPatch, onGeoPatch, onGesture }: Props) {
  const controls = useRef<CameraControls>(null);
  const card = useRef<THREE.Group>(null);
  const { gl, scene, camera } = useThree();
  const g = design.geometry;

  const goTo = useCallback((preset: ViewPreset, smooth = true) => {
    const ctl = controls.current;
    const obj = card.current;
    if (!ctl || !obj) return;
    const [az, po] = ANGLES[preset];
    void ctl.rotateTo(az, po, smooth);
    const pad = preset === 'front' || preset === 'back' ? 1.25 : 0.7;
    void ctl.fitToBox(obj, smooth, { paddingLeft: pad, paddingRight: pad, paddingTop: pad, paddingBottom: pad });
  }, []);

  // initial / camera-mode change framing
  useEffect(() => {
    const id = requestAnimationFrame(() => goTo(view.preset, false));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.camera, goTo]);

  // preset requests
  const lastSignal = useRef(presetSignal);
  useEffect(() => {
    if (presetSignal !== lastSignal.current) {
      lastSignal.current = presetSignal;
      goTo(view.preset, true);
    }
  }, [presetSignal, view.preset, goTo]);

  useEffect(() => {
    if (!primary) return;
    bridge.gl = gl;
    bridge.scene = scene;
    bridge.camera = camera;
    bridge.card = card.current;
    bridge.controls = controls.current;
    bridge.goTo = goTo;
  });
  useEffect(
    () => () => {
      if (primary) {
        bridge.gl = bridge.scene = bridge.camera = bridge.card = bridge.controls = null;
        bridge.goTo = null;
      }
    },
    [primary],
  );

  useFrame((_, dt) => {
    if (turntable && controls.current) controls.current.rotate(dt * 0.32, 0, false);
  });

  // Edits from the inspector arrive without pointer events, so ask for fresh frames explicitly.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let n = 0;
    let id = requestAnimationFrame(function kick() {
      invalidate();
      if (++n < 4) id = requestAnimationFrame(kick);
    });
    return () => cancelAnimationFrame(id);
  }, [design, view, selected, selectedMark, invalidate]);

  /* ---------- mark drag on its face plane (front or mirrored back) ---------- */
  const [guide, setGuide] = useState<SnapGuide | null>(null);
  const designRef = useRef(design);
  designRef.current = design;
  const moveRef = useRef(onMarkMove);
  moveRef.current = onMarkMove;

  const patchRef = useRef({ onMarkPatch, onGeoPatch, onGesture });
  patchRef.current = { onMarkPatch, onGeoPatch, onGesture };

  /**
   * One pointer gesture on a model-space plane: pointer capture, camera controls off only while dragging,
   * Escape / pointercancel revert to the snapshot, pointerup / lostpointercapture commit ONE undo step.
   */
  const runGesture = useCallback(
    (e: ThreeEvent<PointerEvent>, planeZ: number, cursor: string, onMove: (p: { x: number; y: number }, ev: PointerEvent) => void) => {
      const el = gl.domElement;
      const ctl = controls.current;
      const pid = e.nativeEvent.pointerId;
      if (ctl) ctl.enabled = false;
      patchRef.current.onGesture?.('begin');
      const ray = new THREE.Raycaster();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ * MM);
      const hit = new THREE.Vector3();
      const project = (cx: number, cy: number) => {
        const r = el.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
        return ray.ray.intersectPlane(plane, hit) ? { x: hit.x / MM, y: hit.y / MM } : null;
      };
      let done = false;
      const finish = (cancel: boolean) => {
        if (done) return;
        done = true;
        patchRef.current.onGesture?.(cancel ? 'cancel' : 'end');
        if (ctl) ctl.enabled = true;
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', cancelEv);
        el.removeEventListener('lostpointercapture', lost);
        window.removeEventListener('keydown', key, true);
        window.removeEventListener('blur', blur);
        try {
          if (el.hasPointerCapture(pid)) el.releasePointerCapture(pid);
        } catch {
          /* already released */
        }
        el.style.cursor = '';
        setGuide(null);
      };
      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== pid || done) return;
        const p = project(ev.clientX, ev.clientY);
        if (p) onMove(p, ev);
      };
      const up = (ev: PointerEvent) => ev.pointerId === pid && finish(false);
      const cancelEv = (ev: PointerEvent) => ev.pointerId === pid && finish(true);
      const lost = (ev: PointerEvent) => ev.pointerId === pid && finish(false);
      const blur = () => finish(false);
      const key = (ev: KeyboardEvent) => {
        if (ev.key !== 'Escape') return;
        ev.preventDefault();
        ev.stopImmediatePropagation(); // this Escape cancels the drag only (no deselect)
        finish(true);
      };
      try {
        el.setPointerCapture(pid);
      } catch {
        /* synthetic pointers may not be capturable; window listeners below still end the drag */
      }
      el.style.cursor = cursor;
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', cancelEv);
      el.addEventListener('lostpointercapture', lost);
      window.addEventListener('keydown', key, true);
      window.addEventListener('blur', blur);
    },
    [gl, camera],
  );

  const onMarkResizeStart = useCallback(
    (e: ThreeEvent<PointerEvent>, info: MarkResizeInfo) => {
      const m0 = designRef.current.marks.find((m) => m.id === info.markId);
      if (!m0 || m0.locked) return;
      const mirror = info.side === 'back' ? -1 : 1;
      const gg = designRef.current.geometry;
      runGesture(e, info.planeZ, info.sx === info.sy ? 'nesw-resize' : 'nwse-resize', (p) => {
        const next = resizeMark(m0, info.hw, info.hh, info, { x: mirror * p.x, y: p.y }, { w: gg.width, h: gg.height });
        patchRef.current.onMarkPatch?.(info.markId, next);
      });
    },
    [runGesture],
  );

  const onGeoResizeStart = useCallback(
    (e: ThreeEvent<PointerEvent>, info: GeoResizeInfo) => {
      const g0 = designRef.current.geometry;
      const start = { off: g0.contourOffset, half: g0.contourLength };
      runGesture(e, info.planeZ, info.sx === info.sy ? 'nesw-resize' : 'nwse-resize', (p) => {
        const gNow = designRef.current.geometry;
        const patch =
          info.kind === 'outline'
            ? resizeOutline(p)
            : info.kind === 'side'
              ? resizeSide(gNow, p)
              : resizeContour(gNow, info.kind === 'contourTop' ? 'top' : 'bottom', info, start, p);
        patchRef.current.onGeoPatch?.(patch);
      });
    },
    [runGesture],
  );

  const onMarkDragStart = useCallback(
    (e: ThreeEvent<PointerEvent>, info: MarkDragInfo) => {
      const ctl = controls.current;
      if (ctl) ctl.enabled = false;
      const ray = new THREE.Raycaster();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -info.planeZ * MM);
      const hit = new THREE.Vector3();
      const mirror = info.side === 'back' ? -1 : 1; // back coords are as seen from behind
      const project = (cx: number, cy: number) => {
        const r = gl.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
        return ray.ray.intersectPlane(plane, hit) ? { x: (mirror * hit.x) / MM, y: hit.y / MM } : null;
      };
      const start = project(e.nativeEvent.clientX, e.nativeEvent.clientY);
      const m0 = designRef.current.marks.find((m) => m.id === info.markId);
      if (!m0) return;
      const dx = start ? m0.x - start.x : 0;
      const dy = start ? m0.y - start.y : 0;
      const gg = designRef.current.geometry;
      const move = (ev: PointerEvent) => {
        const p = project(ev.clientX, ev.clientY);
        if (!p) return;
        const lim = (v: number, m: number) => Math.round(Math.max(-m, Math.min(m, v)) * 10) / 10;
        let x = lim(p.x + dx, gg.width / 2 - 3);
        let y = lim(p.y + dy, gg.height / 2 - 3);
        let gx: number | null = null;
        let gy: number | null = null;
        if (!ev.shiftKey) {
          // snap to card centre lines and to other marks on the same face (hold Shift for free drag)
          const others = designRef.current.marks.filter((o) => o.id !== info.markId && o.side === info.side && o.visible);
          const sx = snapTo(x, [0, ...others.map((o) => o.x)]);
          const sy = snapTo(y, [0, ...others.map((o) => o.y)]);
          if (sx !== x || others.some((o) => o.x === x) || x === 0) gx = sx;
          if (sy !== y || others.some((o) => o.y === y) || y === 0) gy = sy;
          x = sx;
          y = sy;
        }
        setGuide(gx === null && gy === null ? null : { side: info.side, x: gx, y: gy });
        moveRef.current?.(info.markId, x, y);
      };
      const up = () => {
        setGuide(null);
        patchRef.current.onGesture?.('end');
        if (ctl) ctl.enabled = true;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        gl.domElement.style.cursor = '';
      };
      gl.domElement.style.cursor = 'grabbing';
      patchRef.current.onGesture?.('begin');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [gl, camera],
  );

  const groundY = -(g.height / 2) * MM - 0.18;

  return (
    <>
      {view.camera === 'perspective' ? (
        <PerspectiveCamera makeDefault position={[0, 0, 14]} fov={22} near={0.05} far={200} />
      ) : (
        <OrthographicCamera makeDefault position={[0, 0, 14]} zoom={120} near={-100} far={200} />
      )}
      <CameraControls
        key={view.camera}
        ref={controls}
        makeDefault
        smoothTime={0.42}
        minDistance={1.6}
        maxDistance={40}
        dollySpeed={0.6}
        draggingSmoothTime={0.12}
      />

      <color attach="background" args={[design.lighting.background]} />
      <StudioLights lighting={design.lighting} />

      <ShadingContext.Provider value={view.shading}>
        <MissionCard
          ref={card}
          design={design}
          selected={interactive ? (selected ?? null) : null}
          selectedMark={interactive ? (selectedMark ?? null) : null}
          interactive={!!interactive}
          onSelect={(id) => onSelect?.(id)}
          onSelectMark={(id) => onSelectMark?.(id)}
          onMarkDragStart={onMarkDragStart}
          onMarkResizeStart={onMarkResizeStart}
          onGeoResizeStart={onGeoResizeStart}
          snapGuide={interactive ? guide : null}
        />
      </ShadingContext.Provider>

      {design.lighting.shadows && (
        <>
          <mesh position={[0, 0, -(g.thickness * MM) / 2 - 0.4]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            <shadowMaterial transparent opacity={0.09} />
          </mesh>
          <ContactShadows position={[0, groundY, 0]} opacity={0.32} scale={10} blur={2.6} far={1.4} resolution={512} color="#2a2b2e" />
        </>
      )}

      {view.grid && (
        <group userData={{ helper: true }}>
          <Grid
            position={[0, groundY - 0.002, 0]}
            args={[12, 12]}
            cellSize={0.25}
            cellThickness={0.6}
            cellColor="#b9b7b1"
            sectionSize={1.25}
            sectionThickness={1}
            sectionColor="#8d8b86"
            fadeDistance={22}
            fadeStrength={1.4}
            infiniteGrid
          />
        </group>
      )}
      {view.axes && <axesHelper args={[1.6]} userData={{ helper: true }} />}
      {view.guides && <Guides g={g} />}

      {view.ao && view.shading === 'studio' ? (
        <EffectComposer multisampling={8} enableNormalPass={false}>
          <N8AO aoRadius={0.18} distanceFalloff={0.6} intensity={1.6} quality="high" halfRes={false} />
          <SMAA />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      ) : null}
    </>
  );
}

export function StudioCanvas(props: Props) {
  const support = detectWebGL();
  if (!support.ok) return <ViewportUnavailable reason={support.reason} />;
  return (
    <ViewportBoundary>
      <CanvasInner {...props} />
    </ViewportBoundary>
  );
}

function CanvasInner(props: Props) {
  return (
    <Canvas
      shadows
      frameloop="always"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      onPointerMissed={(e) => {
        if (props.interactive && e.button === 0) props.onSelect?.(null);
      }}
      style={{ touchAction: 'none' }}
    >
      <Rig {...props} />
    </Canvas>
  );
}
