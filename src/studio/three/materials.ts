import { createContext, useContext, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MaterialParams, ShadingMode } from '@/studio/studio/types';
import { makeSurfaceTexture } from './textures';

/*
 * Colour management
 * -----------------
 * 'accurate' (default): every surface is an unlit MeshBasicMaterial whose colour is the
 *   chosen sRGB hex, with toneMapped = false and no post-processing, so the pixel on screen
 *   is exactly the hex in the inspector regardless of camera angle, environment or exposure.
 * 'studio': physically based metals lit by the studio environment. Metals have no diffuse
 *   colour — what you see is the tinted reflection of the lights — so apparent colour
 *   legitimately varies with angle and lighting preset.
 *
 * Materials are created once per hook instance and only their properties are patched; they
 * are never shared with a selection highlight (selection is drawn as a separate outline).
 */

export const ShadingContext = createContext<ShadingMode>('accurate');
export const useShading = () => useContext(ShadingContext);

const MAP_MEAN = 0.78;

function useOwned<T extends { dispose: () => void }>(factory: () => T): T {
  const v = useMemo(factory, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => v.dispose(), [v]);
  return v;
}

/** Exact-colour unlit surface. */
export function useExact(color: string, side: THREE.Side = THREE.FrontSide): THREE.MeshBasicMaterial {
  const m = useOwned(() => new THREE.MeshBasicMaterial({ toneMapped: false }));
  m.color.set(color); // Color.set on a hex string converts sRGB -> linear working space exactly
  m.side = side;
  return m;
}

/** Physically based metal with procedural brushed / blasted micro-surface (studio mode). */
export function useMetal(p: MaterialParams, side: THREE.Side = THREE.FrontSide): THREE.Material {
  const mode = useShading();
  const exact = useExact(p.color, side);
  const tex = useMemo(() => makeSurfaceTexture(p.brush, p.grain, p.direction), [p.brush, p.grain, p.direction]);
  useEffect(() => () => tex.dispose(), [tex]);
  const mat = useOwned(() => new THREE.MeshPhysicalMaterial());

  const textured = p.brush + p.grain > 0.02;
  // Recompile the shader only when the set of maps actually changes.
  if ((mat.roughnessMap !== null) !== textured || mat.side !== side) mat.needsUpdate = true;
  mat.color.set(p.color);
  mat.metalness = p.metalness;
  mat.roughness = Math.min(1, p.roughness / MAP_MEAN);
  mat.roughnessMap = textured ? tex : null;
  mat.bumpMap = textured ? tex : null;
  mat.bumpScale = 0.35 * p.brush + 0.25 * p.grain;
  mat.envMapIntensity = p.reflectivity;
  mat.clearcoat = p.clearcoat;
  mat.clearcoatRoughness = 0.12;
  mat.specularIntensity = p.metalness < 0.5 ? 0.6 : 1;
  mat.side = side;
  return mode === 'accurate' ? exact : mat;
}

export function useFlatMaterial(color: string, roughness: number, metalness: number): THREE.Material {
  const mode = useShading();
  const exact = useExact(color);
  const mat = useOwned(() => new THREE.MeshStandardMaterial());
  mat.color.set(color);
  mat.roughness = roughness;
  mat.metalness = metalness;
  return mode === 'accurate' ? exact : mat;
}
