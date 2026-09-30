import * as THREE from 'three';
import type { GarmentBuild } from './garment-geometry';

/**
 * Handles to the live Three.js objects, for code outside the R3F tree
 * (uploads, hotspot snapping, exports). Set by the viewport components.
 */
export const sceneRefs: {
  gl: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  /** Group that holds the garment and all attachments (garment-local space). */
  root: THREE.Group | null;
  garment: GarmentBuild | null;
} = { gl: null, scene: null, camera: null, root: null, garment: null };

/** Objects flagged with this are helpers (ghost, gizmo) and are skipped by exports. */
export const NO_EXPORT = 'orican:noExport';
