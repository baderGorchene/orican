import * as THREE from 'three';
import { designSize } from './decal';
import type { DesignItem, PrintFinish } from './store';
import { decalPose } from './surface';

/**
 * Prints as part of the garment's own texture.
 *
 * Instead of separate decal meshes, every print is projected inside the
 * garment's fabric shader: each fragment's garment-local position is
 * transformed into each print's projector box and the artwork is blended into
 * the fabric's base color. The fabric's lighting, folds, vertex AO, sheen and
 * knit normal map therefore apply to the ink exactly as to the cloth. Finishes
 * adjust roughness / metalness / knit visibility / sheen / puff height under
 * the ink only.
 */

export const MAX_PRINTS = 8;

/** Projector depth (meters): thin enough not to reach the opposite panel. */
const PROJECTOR_DEPTH = 0.06;

export interface FinishParams {
  roughness: number;
  metalness: number;
  /** Raised-ink height for puff prints (bump strength). */
  puff: number;
  /** 0 = fabric knit fully visible through the ink, 1 = ink is perfectly smooth. */
  smooth: number;
  /** How much of the fabric's sheen the ink removes. */
  sheenCut: number;
}

export const FINISHES: Record<PrintFinish, FinishParams> = {
  dtg: { roughness: 0.93, metalness: 0, puff: 0, smooth: 0.1, sheenCut: 0.55 },
  screen: { roughness: 0.7, metalness: 0, puff: 0, smooth: 0.45, sheenCut: 0.75 },
  puff: { roughness: 0.82, metalness: 0, puff: 1, smooth: 0.8, sheenCut: 0.85 },
  foil: { roughness: 0.22, metalness: 1, puff: 0, smooth: 0.7, sheenCut: 1 },
  vinyl: { roughness: 0.3, metalness: 0, puff: 0, smooth: 0.9, sheenCut: 1 },
};

interface Slot {
  map: { value: THREE.Texture | null };
  /** garment-local → projector box space ([-0.5, 0.5]³) */
  mat: { value: THREE.Matrix4 };
  dir: { value: THREE.Vector3 };
  /** roughness, metalness, puff, opacity */
  a: { value: THREE.Vector4 };
  /** smooth, sheenCut */
  b: { value: THREE.Vector4 };
}

export interface PrintInput {
  item: DesignItem;
  texture: THREE.Texture;
}

const PARS_VERTEX = /* glsl */ `
varying vec3 vPrintPos;
varying vec3 vPrintNormal;
`;

function parsFragment(n: number) {
  let s = `
varying vec3 vPrintPos;
varying vec3 vPrintNormal;
vec3 printPerturbNormal( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir ) {
  vec3 vSigmaX = normalize( dFdx( surf_pos ) );
  vec3 vSigmaY = normalize( dFdy( surf_pos ) );
  vec3 R1 = cross( vSigmaY, surf_norm );
  vec3 R2 = cross( surf_norm, vSigmaX );
  float fDet = dot( vSigmaX, R1 ) * faceDir;
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}
`;
  for (let i = 0; i < n; i++) {
    s += `uniform sampler2D uPrintMap${i}; uniform mat4 uPrintMat${i}; uniform vec3 uPrintDir${i}; uniform vec4 uPrintA${i}; uniform vec4 uPrintB${i};\n`;
  }
  return s;
}

function blendFragment(n: number) {
  // Branch-free so texture derivatives (mipmaps, puff bump) stay well defined.
  let s = `
float printMask = 0.0;
float printRough = 0.0;
float printMetal = 0.0;
float printSmooth = 0.0;
float printSheenCut = 0.0;
float printHeight = 0.0;
vec3 printN = normalize( vPrintNormal );
`;
  for (let i = 0; i < n; i++) {
    s += `
{
  vec3 pp = ( uPrintMat${i} * vec4( vPrintPos, 1.0 ) ).xyz;
  vec3 inside = step( abs( pp ), vec3( 0.5 ) );
  float facing = smoothstep( 0.1, 0.3, dot( printN, uPrintDir${i} ) );
  vec4 ink = texture2D( uPrintMap${i}, pp.xy + 0.5 );
  float a = ink.a * inside.x * inside.y * inside.z * facing * uPrintA${i}.w;
  diffuseColor.rgb = mix( diffuseColor.rgb, ink.rgb, a );
  printRough = mix( printRough, uPrintA${i}.x, a );
  printMetal = mix( printMetal, uPrintA${i}.y, a );
  printSmooth = mix( printSmooth, uPrintB${i}.x, a );
  printSheenCut = mix( printSheenCut, uPrintB${i}.y, a );
  printHeight += a * uPrintA${i}.z;
  printMask = max( printMask, a );
}
`;
  }
  return s;
}

const ROUGHNESS = /* glsl */ `
roughnessFactor = mix( roughnessFactor, printRough, printMask );
`;
const METALNESS = /* glsl */ `
metalnessFactor = mix( metalnessFactor, printMetal, printMask );
`;
const NORMAL_BEFORE = /* glsl */ `
vec3 printBaseNormal = normal;
`;
const NORMAL_AFTER = /* glsl */ `
normal = normalize( mix( normal, printBaseNormal, printMask * printSmooth ) );
if ( printHeight > 0.0 ) {
  vec2 dH = vec2( dFdx( printHeight ), dFdy( printHeight ) ) * 1.6;
  normal = printPerturbNormal( - vViewPosition, normal, dH, faceDirection );
}
`;
const SHEEN = /* glsl */ `
#ifdef USE_SHEEN
material.sheenColor *= 1.0 - printMask * printSheenCut;
#endif
`;

export class PrintLayer {
  private slots: Slot[] = Array.from({ length: MAX_PRINTS }, () => ({
    map: { value: null },
    mat: { value: new THREE.Matrix4() },
    dir: { value: new THREE.Vector3(0, 0, 1) },
    a: { value: new THREE.Vector4() },
    b: { value: new THREE.Vector4() },
  }));
  private count = 0;
  private materials = new Set<THREE.Material>();

  /** Installs the print projection into a MeshStandard/MeshPhysical material. */
  attach(material: THREE.MeshStandardMaterial) {
    this.materials.add(material);
    material.onBeforeCompile = (shader) => {
      const n = this.count;
      for (let i = 0; i < n; i++) {
        const slot = this.slots[i];
        shader.uniforms[`uPrintMap${i}`] = slot.map;
        shader.uniforms[`uPrintMat${i}`] = slot.mat;
        shader.uniforms[`uPrintDir${i}`] = slot.dir;
        shader.uniforms[`uPrintA${i}`] = slot.a;
        shader.uniforms[`uPrintB${i}`] = slot.b;
      }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${PARS_VERTEX}`)
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvPrintNormal = objectNormal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPrintPos = transformed;');
      if (n === 0) return;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${parsFragment(n)}`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n${blendFragment(n)}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${ROUGHNESS}`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${METALNESS}`)
        .replace('#include <normal_fragment_maps>', `${NORMAL_BEFORE}\n#include <normal_fragment_maps>\n${NORMAL_AFTER}`)
        .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>\n${SHEEN}`);
    };
    material.customProgramCacheKey = () => `orican-prints-${this.count}`;
    material.needsUpdate = true;
  }

  detach(material: THREE.Material) {
    this.materials.delete(material);
  }

  /** Updates the projected prints (bottom → top). Recompiles only when the print count changes. */
  update(prints: PrintInput[]) {
    const list = prints.slice(-MAX_PRINTS);
    list.forEach(({ item, texture }, i) => {
      const slot = this.slots[i];
      const { w, h } = designSize(item.placement, item.aspect);
      const { position, quaternion } = decalPose(item.placement);
      slot.mat.value
        .compose(position, quaternion, new THREE.Vector3(w, h, PROJECTOR_DEPTH))
        .invert();
      slot.dir.value.set(...item.placement.normal).normalize();
      slot.map.value = texture;
      const f = FINISHES[item.finish ?? 'dtg'];
      slot.a.value.set(f.roughness, f.metalness, f.puff, item.visible ? 1 : 0);
      slot.b.value.set(f.smooth, f.sheenCut, 0, 0);
    });
    if (list.length !== this.count) {
      this.count = list.length;
      this.materials.forEach((m) => (m.needsUpdate = true));
    }
  }
}

/**
 * CPU hit test matching the shader's projection: the topmost visible print
 * whose projector box contains `point` (garment-local) and faces `normal`.
 */
export function printAtPoint(designs: DesignItem[], point: THREE.Vector3, normal: THREE.Vector3): DesignItem | null {
  const inv = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (let i = designs.length - 1; i >= 0; i--) {
    const item = designs[i];
    if (!item.visible) continue;
    const dir = new THREE.Vector3(...item.placement.normal).normalize();
    if (dir.dot(normal) < 0.1) continue;
    const { w, h } = designSize(item.placement, item.aspect);
    const { position, quaternion } = decalPose(item.placement);
    inv.compose(position, quaternion, new THREE.Vector3(w, h, PROJECTOR_DEPTH)).invert();
    p.copy(point).applyMatrix4(inv);
    if (Math.abs(p.x) <= 0.5 && Math.abs(p.y) <= 0.5 && Math.abs(p.z) <= 0.5) return item;
  }
  return null;
}
