import * as THREE from 'three';
import type { AssetEntry } from './assets';
import type { Vec3 } from './surface';

/**
 * Per-item editing of 3D attachments: extra transforms on top of the surface
 * placement (tilt, stretch, mirror) and look filters (color grading + material
 * override). Shared by the live scene and the print bake, so a baked print
 * looks exactly like the 3D model did.
 */

export interface ModelTransform {
  /** Tilt around the surface tangent X / Y axes, radians. */
  tiltX: number;
  tiltY: number;
  /** Non-uniform stretch on top of the uniform placement scale. */
  stretch: Vec3;
  flipX: boolean;
}

export type MaterialMode = 'original' | 'matte' | 'glossy' | 'metal' | 'chrome' | 'gold';

export interface ModelFilters {
  preset: string;
  /** -0.5 … 0.5 added to RGB */
  brightness: number;
  /** 0 … 2 */
  contrast: number;
  /** 0 … 2 */
  saturation: number;
  /** degrees, -180 … 180 */
  hue: number;
  tint: string;
  /** 0 … 1 */
  tintAmount: number;
  material: MaterialMode;
}

export const DEFAULT_TRANSFORM: ModelTransform = { tiltX: 0, tiltY: 0, stretch: [1, 1, 1], flipX: false };

export const DEFAULT_FILTERS: ModelFilters = {
  preset: 'none',
  brightness: 0,
  contrast: 1,
  saturation: 1,
  hue: 0,
  tint: '#ffffff',
  tintAmount: 0,
  material: 'original',
};

export const FILTER_PRESETS: { id: string; label: string; filters: Partial<ModelFilters> }[] = [
  { id: 'none', label: 'None', filters: {} },
  { id: 'mono', label: 'Mono', filters: { saturation: 0 } },
  { id: 'sepia', label: 'Sepia', filters: { saturation: 0, tint: '#d2a679', tintAmount: 0.75, contrast: 1.05 } },
  { id: 'vintage', label: 'Vintage', filters: { contrast: 0.88, saturation: 0.7, brightness: 0.03, tint: '#ebc996', tintAmount: 0.35 } },
  { id: 'vivid', label: 'Vivid', filters: { contrast: 1.15, saturation: 1.55 } },
  { id: 'noir', label: 'Noir', filters: { saturation: 0, contrast: 1.45, brightness: -0.05 } },
  { id: 'warm', label: 'Warm', filters: { tint: '#ffb27a', tintAmount: 0.28, saturation: 1.1 } },
  { id: 'cool', label: 'Cool', filters: { tint: '#8fb4ff', tintAmount: 0.28 } },
  { id: 'gold', label: 'Gold', filters: { material: 'gold' } },
  { id: 'chrome', label: 'Chrome', filters: { material: 'chrome', saturation: 0 } },
];

export function presetFilters(id: string): ModelFilters {
  const p = FILTER_PRESETS.find((x) => x.id === id);
  return { ...DEFAULT_FILTERS, ...(p?.filters ?? {}), preset: id };
}

export const MATERIAL_MODES: { id: MaterialMode; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'matte', label: 'Matte' },
  { id: 'glossy', label: 'Glossy' },
  { id: 'metal', label: 'Metal' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'gold', label: 'Gold' },
];

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

export interface AttachmentLayout {
  /** Local matrix applied inside the surface frame (before the uniform scale). */
  matrix: THREE.Matrix4;
  /** Conservative footprint half extents on the mounting plane, meters at scale 1. */
  footprint: { hx: number; hy: number };
  /** Bounds of the transformed part in frame space at scale 1. */
  bounds: THREE.Box3;
}

const assetBoxes = new WeakMap<THREE.Object3D, THREE.Box3>();
function assetBox(asset: AssetEntry): THREE.Box3 {
  let box = assetBoxes.get(asset.object);
  if (!box) {
    box = new THREE.Box3().setFromObject(asset.object);
    assetBoxes.set(asset.object, box);
  }
  return box;
}

/** stretch/mirror → tilt → lift so the lowest point rests on the fabric (z = 0). */
export function attachmentLayout(asset: AssetEntry, t: ModelTransform): AttachmentLayout {
  const [sx, sy, sz] = t.stretch;
  const scale = new THREE.Matrix4().makeScale(sx * (t.flipX ? -1 : 1), sy, sz);
  const tilt = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(t.tiltX, t.tiltY, 0, 'XYZ'));
  const m = tilt.multiply(scale);
  const bounds = assetBox(asset).clone().applyMatrix4(m);
  const lift = new THREE.Matrix4().makeTranslation(0, 0, -bounds.min.z);
  bounds.translate(new THREE.Vector3(0, 0, -bounds.min.z));
  return {
    matrix: lift.multiply(m),
    footprint: {
      hx: Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)),
      hy: Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y)),
    },
    bounds,
  };
}

// ---------------------------------------------------------------------------
// Filters (display-space color grading injected into the material shaders)
// ---------------------------------------------------------------------------

interface FilterUniforms {
  uBrightness: { value: number };
  uContrast: { value: number };
  uSaturation: { value: number };
  uHue: { value: number };
  uTint: { value: THREE.Color };
  uTintAmount: { value: number };
}

const GRADE_GLSL = /* glsl */ `
  {
    vec3 c = gl_FragColor.rgb + uBrightness;
    c = (c - 0.5) * uContrast + 0.5;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    const vec3 k = vec3(0.57735);
    float ch = cos(uHue);
    c = c * ch + cross(k, c) * sin(uHue) + k * dot(k, c) * (1.0 - ch);
    float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(c, uTint * l2 * 1.25, uTintAmount);
    gl_FragColor.rgb = clamp(c, 0.0, 1.0);
  }
`;

function makeUniforms(): FilterUniforms {
  return {
    uBrightness: { value: 0 },
    uContrast: { value: 1 },
    uSaturation: { value: 1 },
    uHue: { value: 0 },
    uTint: { value: new THREE.Color('#ffffff') },
    uTintAmount: { value: 0 },
  };
}

function patchMaterial(material: THREE.Material, uniforms: FilterUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        'uniform float uBrightness; uniform float uContrast; uniform float uSaturation; uniform float uHue; uniform vec3 uTint; uniform float uTintAmount;\nvoid main() {',
      )
      .replace('#include <dithering_fragment>', `${GRADE_GLSL}\n#include <dithering_fragment>`);
  };
  material.customProgramCacheKey = () => 'orican-grade';
  material.needsUpdate = true;
}

function applyMaterialMode(material: THREE.Material, mode: MaterialMode) {
  const m = material as THREE.MeshStandardMaterial;
  if (!('roughness' in m) || mode === 'original') return;
  switch (mode) {
    case 'matte':
      m.roughness = 0.9;
      m.metalness = 0;
      break;
    case 'glossy':
      m.roughness = 0.12;
      m.metalness = 0;
      break;
    case 'metal':
      m.roughness = 0.32;
      m.metalness = 1;
      break;
    case 'chrome':
      m.roughness = 0.06;
      m.metalness = 1;
      m.color?.set('#ffffff');
      m.envMapIntensity = 2;
      break;
    case 'gold':
      m.roughness = 0.24;
      m.metalness = 1;
      m.color?.set('#e7b95e');
      m.envMapIntensity = 1.8;
      break;
  }
}

/**
 * Clones the asset with its own materials, applies the material mode and
 * installs the grading shader. Grading values are uniforms, so later filter
 * changes go through `updateFilterUniforms` without recompiling.
 */
export function makeFilteredObject(source: THREE.Object3D, filters: ModelFilters): THREE.Object3D {
  const copy = source.clone(true);
  const uniforms = makeUniforms();
  copy.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const clone = (mat: THREE.Material) => {
      const c = mat.clone();
      applyMaterialMode(c, filters.material);
      patchMaterial(c, uniforms);
      return c;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
  });
  copy.userData.filterUniforms = uniforms;
  updateFilterUniforms(copy, filters);
  return copy;
}

export function updateFilterUniforms(object: THREE.Object3D, f: ModelFilters) {
  const u = object.userData.filterUniforms as FilterUniforms | undefined;
  if (!u) return;
  u.uBrightness.value = f.brightness;
  u.uContrast.value = f.contrast;
  u.uSaturation.value = f.saturation;
  u.uHue.value = THREE.MathUtils.degToRad(f.hue);
  // Grading runs on display-space color, so keep the hex values unconverted.
  u.uTint.value.setStyle(f.tint, THREE.LinearSRGBColorSpace);
  u.uTintAmount.value = f.tintAmount;
}

export function disposeFilteredObject(object: THREE.Object3D) {
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
  });
}
