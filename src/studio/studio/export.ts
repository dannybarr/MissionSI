import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { bridge } from './bridge';
import { serializeProject } from './schema';
import type { Project } from './types';

export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mission';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportProjectJSON(project: Project) {
  downloadBlob(new Blob([serializeProject(project)], { type: 'application/json' }), `${slug(project.name)}.mission.json`);
}

function hideHelpers(scene: THREE.Scene): () => void {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.userData?.helper && o.visible) {
      o.visible = false;
      hidden.push(o);
    }
  });
  return () => hidden.forEach((o) => (o.visible = true));
}

export interface RenderResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * High-resolution still: re-renders the live scene at an elevated pixel ratio
 * into the drawing buffer and reads it back immediately.
 */
export function renderStill(scale: number, transparent: boolean): RenderResult {
  const { gl, scene, camera } = bridge;
  if (!gl || !scene || !camera) throw new Error('The 3D viewport is not available (WebGL could not start or compare/presentation mode is active).');
  const size = gl.getSize(new THREE.Vector2());
  const maxTex = gl.capabilities.maxTextureSize || 8192;
  const s = Math.max(1, Math.min(scale, Math.floor(Math.min(maxTex / size.x, maxTex / size.y))));
  const prevPR = gl.getPixelRatio();
  const prevBg = scene.background;
  const prevClear = gl.getClearAlpha();
  const restoreHelpers = hideHelpers(scene);
  try {
    // keep the live tone mapping: forcing it here broke True colour (unlit, toneMapped:false) parity with the viewport
    if (transparent) {
      scene.background = null;
      gl.setClearAlpha(0);
    }
    gl.setPixelRatio(s);
    gl.setSize(size.x, size.y, false);
    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/png');
    if (!dataUrl.startsWith('data:image/png;base64,') || dataUrl.length < 200) throw new Error('The renderer returned an empty image. Try a smaller scale.');
    return { dataUrl, width: Math.round(size.x * s), height: Math.round(size.y * s) };
  } finally {
    scene.background = prevBg;
    gl.setClearAlpha(prevClear);
    gl.setPixelRatio(prevPR);
    gl.setSize(size.x, size.y, false);
    restoreHelpers();
  }
}

export async function exportGLB(name: string): Promise<number> {
  const result = await buildGLB();
  downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), `${slug(name)}.glb`);
  return result.byteLength;
}

/** Binary glTF of the live card with viewport aids removed. */
export async function buildGLB(): Promise<ArrayBuffer> {
  const card = bridge.card;
  if (!card) throw new Error('The 3D viewport is not available (WebGL could not start or compare/presentation mode is active).');
  const clone = card.clone(true);
  clone.traverse((o) => {
    if (o.userData?.helper || o.userData?.formEdge) o.visible = false; // outlines are viewport aids, not product geometry
  });
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(clone, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
  if (!(result instanceof ArrayBuffer)) throw new Error('Exporter did not return binary data.');
  return result;
}

// Dev-only handle for automated renderer verification (scripts/verify-renderer.mjs). Stripped from production builds.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __missionDebug: unknown }).__missionDebug = { bridge, renderStill, buildGLB, Raycaster: THREE.Raycaster };
}

export function nextFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (k: number) => (k <= 0 ? resolve() : requestAnimationFrame(() => step(k - 1)));
    step(n);
  });
}
