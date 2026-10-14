import type * as THREE from 'three';
import type { CameraControls } from '@react-three/drei';
import type { ViewPreset } from './types';

/**
 * Imperative handles registered by the primary viewport so toolbar actions
 * (render, export, camera presets) can reach the live WebGL scene.
 */
export interface ViewportBridge {
  gl: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  card: THREE.Group | null;
  controls: CameraControls | null;
  goTo: ((preset: ViewPreset, smooth?: boolean) => void) | null;
}

export const bridge: ViewportBridge = {
  gl: null,
  scene: null,
  camera: null,
  card: null,
  controls: null,
  goTo: null,
};
